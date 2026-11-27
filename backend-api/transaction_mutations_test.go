package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func TestTransactionEditWindow(t *testing.T) {
	now := time.Date(2026, time.November, 18, 12, 0, 0, 0, time.UTC)
	for _, test := range []struct {
		name     string
		created  interface{}
		editable bool
	}{
		{name: "just created", created: now.Format(time.RFC3339Nano), editable: true},
		{name: "just before cutoff", created: now.Add(-transactionEditWindow + time.Nanosecond).Format(time.RFC3339Nano), editable: true},
		{name: "at cutoff", created: now.Add(-transactionEditWindow).Format(time.RFC3339Nano)},
		{name: "older", created: now.Add(-8 * 24 * time.Hour).Format(time.RFC3339Nano)},
		{name: "future", created: now.Add(time.Hour).Format(time.RFC3339Nano)},
		{name: "legacy"},
		{name: "invalid", created: "2026-11-18"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, editable := currentEditDeadline(test.created, now); editable != test.editable {
				t.Errorf("editable = %t, want %t", editable, test.editable)
			}
		})
	}
}

func TestTransactionChangesPreserveCreationTime(t *testing.T) {
	const createdAt = "2026-11-18T12:00:00Z"
	item := map[string]interface{}{"id": "txn", "CreatedAt": createdAt, "Timestamp": "2026-10-01 13:00:00", "Income": "30.50"}
	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	amount, timestamp, note := "14.25", time.Now().In(transactionLocation).Add(-time.Hour).Format(transactionTimestampLayout), ""
	if !applyTransactionChanges(context, item, "Income", transactionChanges{Amount: &amount, Note: &note, Timestamp: &timestamp}) {
		t.Fatalf("could not edit transaction: %s", response.Body.String())
	}
	if item["CreatedAt"] != createdAt || item["id"] != "txn" || item["Income"] != amount || item["Timestamp"] != timestamp || item["Income_Note"] != note {
		t.Errorf("unexpected edited transaction: %v", item)
	}
}

func transactionTestToken(t *testing.T) string {
	t.Helper()
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	publicKey, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		t.Fatal(err)
	}
	t.Setenv("RSA_Public_Secret_Key", base64.StdEncoding.EncodeToString(publicKey))
	token, err := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{}).SignedString(privateKey)
	if err != nil {
		t.Fatal(err)
	}
	t.Setenv("Cosmos_DB_Key", base64.StdEncoding.EncodeToString([]byte("test-only Cosmos DB key")))
	return token
}

type transactionTestQuery struct {
	Query      string
	Parameters []transactionTestParameter
}

type transactionTestParameter struct{ Name, Value string }

func TestTransactionMutationPreconditionsAndMove(t *testing.T) {
	token := transactionTestToken(t)
	const version = `"current-version"`
	createdAt := time.Now().UTC().Format(time.RFC3339Nano)
	oldTime := time.Now().In(transactionLocation).Add(-2 * time.Hour)
	newTime := oldTime.Add(time.Hour)
	oldID := transactionID(oldTime, "salary", "")
	// A normal create request for the new time hashes this same timestamp and label.
	newID := fmt.Sprintf("%x", sha256.Sum256([]byte(newTime.Format("01/02/2006 15:04:05")+"salary")))
	futureTime := time.Now().In(transactionLocation).Add(time.Hour)
	for _, test := range []struct {
		name, method, version, batchResult, message string
		timestamp                                   time.Time
		status, reads, queries, writes              int
		legacyDuplicate                             bool
	}{
		{name: "patch requires version", method: http.MethodPatch, status: http.StatusPreconditionRequired},
		{name: "delete requires version", method: http.MethodDelete, status: http.StatusPreconditionRequired},
		{name: "outdated delete", method: http.MethodDelete, version: `"old-version"`, status: http.StatusConflict, reads: 1},
		{name: "future date", method: http.MethodPatch, version: version, timestamp: futureTime, status: http.StatusBadRequest, message: "cannot be in the future", reads: 1},
		{name: "move", method: http.MethodPatch, version: version, timestamp: newTime, status: http.StatusNoContent, reads: 1, queries: 1, writes: 1},
		{name: "legacy duplicate destination", method: http.MethodPatch, version: version, timestamp: newTime, status: http.StatusConflict, message: "already exists", reads: 1, queries: 1, legacyDuplicate: true},
		{name: "concurrent duplicate destination", method: http.MethodPatch, version: version, timestamp: newTime, status: http.StatusConflict, message: "already exists", reads: 1, queries: 1, writes: 1, batchResult: `[{"statusCode":424},{"statusCode":409}]`},
		{name: "concurrent edit", method: http.MethodPatch, version: version, timestamp: newTime, status: http.StatusConflict, message: "transaction changed", reads: 1, queries: 1, writes: 1, batchResult: `[{"statusCode":412},{"statusCode":424}]`},
	} {
		t.Run(test.name, func(t *testing.T) {
			var reads, queries, writes atomic.Int32
			cosmos := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, "/docs/"+oldID) {
					reads.Add(1)
					w.Header().Set("ETag", version)
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"id": oldID, "CreatedAt": createdAt, "pk": 1, "Label_key": "salary",
						"Timestamp": oldTime.Format(transactionTimestampLayout), "Income": "10.00", "_etag": version,
					})
					return
				}
				if r.Method != http.MethodPost || !strings.HasSuffix(r.URL.Path, "/docs") {
					t.Errorf("unexpected Cosmos request: %s %s", r.Method, r.URL.Path)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
				if r.Header.Get("Content-Type") == "application/query+json" {
					queries.Add(1)
					var query transactionTestQuery
					if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
						t.Errorf("decode destination query: %v", err)
						w.WriteHeader(http.StatusBadRequest)
						return
					}
					wantQuery := "SELECT TOP 1 VALUE c.id FROM c WHERE c.Timestamp = @timestamp AND c.Label_key = @labelId AND c.id != @sourceId"
					wantParameters := []transactionTestParameter{
						{"@timestamp", newTime.Format(transactionTimestampLayout)},
						{"@labelId", "salary"},
						{"@sourceId", oldID},
					}
					if query.Query != wantQuery || !reflect.DeepEqual(query.Parameters, wantParameters) {
						t.Errorf("unexpected income destination query: %+v", query)
					}
					if test.legacyDuplicate {
						_, _ = fmt.Fprint(w, `{"Documents":["unrelated-legacy-id"]}`)
						return
					}
					_, _ = fmt.Fprint(w, `{"Documents":[]}`)
					return
				}
				writes.Add(1)
				var ops []struct {
					OperationType string                 `json:"operationType"`
					ID            string                 `json:"id"`
					IfMatch       string                 `json:"ifMatch"`
					ResourceBody  map[string]interface{} `json:"resourceBody"`
				}
				if err := json.NewDecoder(r.Body).Decode(&ops); err != nil || len(ops) != 2 {
					t.Errorf("expected an atomic two-operation batch, got %v, %v", ops, err)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
				if ops[0].OperationType != "Delete" || ops[0].ID != oldID || ops[0].IfMatch != version {
					t.Errorf("expected a conditional delete of the original ID, got %+v", ops[0])
				}
				item := ops[1].ResourceBody
				if ops[1].OperationType != "Create" || item["id"] != newID || item["CreatedAt"] != createdAt || item["Timestamp"] != newTime.Format(transactionTimestampLayout) || item["_etag"] != nil {
					t.Errorf("unexpected replacement document: %+v", ops[1])
				}
				if test.batchResult != "" {
					w.WriteHeader(http.StatusMultiStatus)
					_, _ = fmt.Fprint(w, test.batchResult)
					return
				}
				_, _ = fmt.Fprint(w, `[{"statusCode":204},{"statusCode":201}]`)
			}))
			defer cosmos.Close()
			t.Setenv("Cosmos_DB_Endpoint", cosmos.URL)

			router := gin.New()
			router.Handle(test.method, "/api/income/:id", mutateTransaction("Income", func() string { return "Income" }))
			body := fmt.Sprintf(`{"timestamp":%q}`, test.timestamp.Format(transactionTimestampLayout))
			request := httptest.NewRequest(test.method, "/api/income/"+oldID, strings.NewReader(body))
			request.AddCookie(&http.Cookie{Name: "token", Value: token})
			request.Header.Set("Content-Type", "application/json")
			if test.version != "" {
				request.Header.Set("If-Match", test.version)
			}
			response := httptest.NewRecorder()
			router.ServeHTTP(response, request)
			if response.Code != test.status || !strings.Contains(response.Body.String(), test.message) {
				t.Errorf("response = %d %s, want %d %q", response.Code, response.Body.String(), test.status, test.message)
			}
			if int(reads.Load()) != test.reads || int(queries.Load()) != test.queries || int(writes.Load()) != test.writes {
				t.Errorf("Cosmos calls = %d reads, %d queries, %d writes, want %d reads, %d queries, %d writes", reads.Load(), queries.Load(), writes.Load(), test.reads, test.queries, test.writes)
			}
		})
	}
}

func TestTransactionCreationRejectsLegacyDuplicates(t *testing.T) {
	token := transactionTestToken(t)
	t.Setenv("Cosmos_DB_Fact_Database", "Fact")
	t.Setenv("Cosmos_DB_Dim_Database", "Dim")
	t.Setenv("Cosmos_DB_Expense_Container", "Expenses")
	t.Setenv("Cosmos_DB_Income_Container", "Income")
	t.Setenv("Cosmos_DB_OnBehalf_Container", "Recipients")
	timestamp := "2026-01-02 10:00:00"
	cosmos := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost || r.Header.Get("Content-Type") != "application/query+json" {
			t.Errorf("unexpected database write: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/dbs/Dim/") {
			if strings.Contains(r.URL.Path, "/colls/Recipients/") {
				_, _ = fmt.Fprint(w, `{"Documents":[{"id":"me","On-Behalf":"Me"}]}`)
			} else {
				_, _ = fmt.Fprint(w, `{"Documents":[{"id":"label"}]}`)
			}
			return
		}
		var query transactionTestQuery
		if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
			t.Errorf("decode duplicate query: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		wantQuery := "SELECT TOP 1 VALUE c.id FROM c WHERE c.Timestamp = @timestamp AND c.Label_key = @labelId"
		wantParameters := []transactionTestParameter{{"@timestamp", timestamp}, {"@labelId", "label"}}
		if strings.Contains(r.URL.Path, "/colls/Expenses/") {
			wantQuery += " AND c.User_key = @onBehalfId"
			wantParameters = append(wantParameters, transactionTestParameter{"@onBehalfId", "me"})
		}
		if query.Query != wantQuery || !reflect.DeepEqual(query.Parameters, wantParameters) {
			t.Errorf("unexpected new transaction query: %+v", query)
		}
		_, _ = fmt.Fprint(w, `{"Documents":["unrelated-legacy-id"]}`)
	}))
	defer cosmos.Close()
	t.Setenv("Cosmos_DB_Endpoint", cosmos.URL)

	router := gin.New()
	router.POST("/api/expense", postExpense)
	router.POST("/api/income", postIncome)
	for _, test := range []struct{ path, body string }{
		{"/api/expense", `{"Expense":"1.00","Timestamp":"01/02/2026 10:00:00","Label_key":"label","Onbehalf":"Me","User_key":"me"}`},
		{"/api/income", `{"Income":"1.00","Timestamp":"01/02/2026 10:00:00","Label_key":"label"}`},
	} {
		request := httptest.NewRequest(http.MethodPost, test.path, strings.NewReader(test.body))
		request.AddCookie(&http.Cookie{Name: "token", Value: token})
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != http.StatusConflict || !strings.Contains(response.Body.String(), "already exists") {
			t.Errorf("%s returned %d %s, want a duplicate conflict", test.path, response.Code, response.Body.String())
		}
	}
}

func TestTransactionReportIncludesDecimalAmounts(t *testing.T) {
	rows := []map[string]interface{}{
		{"Expense": "14.25", "CreatedAt": time.Now().UTC().Format(time.RFC3339Nano)},
		{"Expense": 30.50, "CreatedAt": time.Now().Add(-transactionEditWindow).UTC().Format(time.RFC3339Nano)},
		{"Expense": "3.05"},
	}
	if total := reportTransactionTotal(rows, "Expense"); total != 47.80 {
		t.Errorf("total = %v, want 47.80", total)
	}
	if rows[0]["editExpiresAt"] == nil || rows[1]["editExpiresAt"] != nil || rows[2]["editExpiresAt"] != nil {
		t.Errorf("unexpected edit availability: %v", rows)
	}
}

func TestTransactionMutationRequiresAuthentication(t *testing.T) {
	for _, method := range []string{http.MethodPatch, http.MethodDelete} {
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		context.Request = httptest.NewRequest(method, "/api/expense/txn", nil)
		handler := mutateTransaction("Expense", func() string {
			t.Fatal("unauthenticated request reached data access")
			return ""
		})
		handler(context)
		if response.Code != http.StatusUnauthorized {
			t.Errorf("%s returned %d, want 401", method, response.Code)
		}
	}
}

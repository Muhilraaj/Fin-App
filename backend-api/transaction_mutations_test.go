package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
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
	amount, timestamp, note := "14.25", "2026-09-01 00:30:00", ""
	if !applyTransactionChanges(context, item, "Income", transactionChanges{Amount: &amount, Note: &note, Timestamp: &timestamp}) {
		t.Fatalf("could not edit transaction: %s", response.Body.String())
	}
	if item["CreatedAt"] != createdAt || item["id"] != "txn" || item["Income"] != amount || item["Timestamp"] != timestamp || item["Income_Note"] != note {
		t.Errorf("unexpected edited transaction: %v", item)
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

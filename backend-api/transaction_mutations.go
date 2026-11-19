package main

import (
	azcosmosapi "api/azcosmos-api"
	"api/cosmosconfig"
	"errors"
	"log"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/gin-gonic/gin"
)

const (
	transactionEditWindow      = 7 * 24 * time.Hour
	transactionTimestampLayout = "2006-01-02 15:04:05"
)

var transactionIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,255}$`)

type transactionChanges struct {
	Amount     *string `json:"amount"`
	Note       *string `json:"note"`
	Timestamp  *string `json:"timestamp"`
	LabelID    *string `json:"labelId"`
	OnBehalfID *string `json:"onBehalfId"`
}

func currentEditDeadline(createdAt interface{}, now time.Time) (time.Time, bool) {
	value, ok := createdAt.(string)
	if !ok {
		return time.Time{}, false
	}
	created, err := time.Parse(time.RFC3339Nano, value)
	if err != nil || now.Before(created) {
		return time.Time{}, false
	}
	deadline := created.Add(transactionEditWindow)
	return deadline, now.Before(deadline)
}

func reportTransactionTotal(rows []map[string]interface{}, amountField string) float64 {
	now := time.Now()
	var totalPaise float64
	for _, row := range rows {
		if deadline, editable := currentEditDeadline(row["CreatedAt"], now); editable {
			row["editExpiresAt"] = deadline.UTC().Format(time.RFC3339Nano)
		}
		delete(row, "CreatedAt")

		var amount float64
		switch value := row[amountField].(type) {
		case float64:
			amount = value
		case int:
			amount = float64(value)
		case string:
			amount, _ = strconv.ParseFloat(strings.TrimSpace(value), 64)
		}
		paise := math.Round(amount * 100)
		if !math.IsNaN(paise) && !math.IsInf(totalPaise+paise, 0) {
			totalPaise += paise
		}
	}
	return totalPaise / 100
}

func mutateTransaction(amountField string, getContainer func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		setAdminCORS(c, "PATCH, DELETE")
		if !requireAuth(c) {
			return
		}
		id := c.Param("id")
		if !transactionIDPattern.MatchString(id) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transaction ID"})
			return
		}

		ctx := c.Request.Context()
		database := cosmosconfig.FactDatabase()
		container := getContainer()
		item, version, err := azcosmosapi.ReadItem(ctx, database, container, id)
		if err != nil {
			writeTransactionStoreError(c, err)
			return
		}
		deadline, editable := currentEditDeadline(item["CreatedAt"], time.Now())
		if !editable {
			writeTransactionExpired(c)
			return
		}
		if version == "" {
			writeTransactionStoreError(c, errors.New("transaction response is missing its ETag"))
			return
		}
		if expected := c.GetHeader("If-Match"); expected != "" && expected != string(version) {
			writeTransactionConflict(c)
			return
		}

		if c.Request.Method == http.MethodDelete {
			err = azcosmosapi.DeleteItemIfMatch(ctx, database, container, id, version)
		} else {
			var changes transactionChanges
			if err := c.ShouldBindJSON(&changes); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transaction details"})
				return
			}
			if !applyTransactionChanges(c, item, amountField, changes) {
				return
			}
			if !time.Now().Before(deadline) {
				writeTransactionExpired(c)
				return
			}
			for _, property := range []string{"_rid", "_self", "_etag", "_attachments", "_ts"} {
				delete(item, property)
			}
			err = azcosmosapi.ReplaceItemIfMatch(ctx, database, container, item, version)
		}
		if err != nil {
			writeTransactionStoreError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func applyTransactionChanges(c *gin.Context, item map[string]interface{}, amountField string, changes transactionChanges) bool {
	if changes.Amount == nil && changes.Note == nil && changes.Timestamp == nil && changes.LabelID == nil && changes.OnBehalfID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provide at least one transaction change"})
		return false
	}
	if changes.Amount != nil {
		amount := strings.TrimSpace(*changes.Amount)
		value, err := strconv.ParseFloat(amount, 64)
		if err != nil || math.IsNaN(value) || math.IsInf(value*100, 0) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "enter a valid amount"})
			return false
		}
		item[amountField] = amount
	}
	if changes.Note != nil {
		item[amountField+"_Note"] = *changes.Note
	}
	if changes.Timestamp != nil {
		timestamp, err := time.Parse(transactionTimestampLayout, *changes.Timestamp)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "enter a valid transaction date and time"})
			return false
		}
		item["Timestamp"] = timestamp.Format(transactionTimestampLayout)
	}
	isExpense := amountField == "Expense"
	if changes.LabelID != nil && item["Label_key"] != *changes.LabelID {
		container := cosmosconfig.IncomeLabelContainer()
		if isExpense {
			container = cosmosconfig.LabelContainer()
		}
		label, found := readTransactionReference(c, container, *changes.LabelID, "label")
		if !found {
			return false
		}
		if !cosmosconfig.IsLabelActive(label) || (isExpense && (label["Custom"] == "Construction") != (item["Custom"] == "Construction")) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "choose an active label for this transaction"})
			return false
		}
		item["Label_key"] = *changes.LabelID
	}
	if changes.OnBehalfID != nil {
		if !isExpense {
			c.JSON(http.StatusBadRequest, gin.H{"error": "only expenses have an on-behalf entry"})
			return false
		}
		if item["User_key"] != *changes.OnBehalfID {
			if _, found := readTransactionReference(c, cosmosconfig.OnBehalfContainer(), *changes.OnBehalfID, "on-behalf entry"); !found {
				return false
			}
			item["User_key"] = *changes.OnBehalfID
		}
	}
	return true
}

func readTransactionReference(c *gin.Context, container, id, name string) (map[string]interface{}, bool) {
	if !transactionIDPattern.MatchString(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "choose a valid " + name})
		return nil, false
	}
	item, _, err := azcosmosapi.ReadItem(c.Request.Context(), cosmosconfig.DimDatabase(), container, id)
	if err == nil {
		return item, true
	}
	var response *azcore.ResponseError
	if errors.As(err, &response) && response.StatusCode == http.StatusNotFound {
		c.JSON(http.StatusBadRequest, gin.H{"error": "choose a valid " + name})
	} else {
		writeTransactionStoreError(c, err)
	}
	return nil, false
}

func writeTransactionExpired(c *gin.Context) {
	c.JSON(http.StatusForbidden, gin.H{"error": "transactions can be edited or deleted within 7 days of creation"})
}

func writeTransactionConflict(c *gin.Context) {
	c.JSON(http.StatusConflict, gin.H{"error": "this transaction changed. Refresh the report and try again"})
}

func writeTransactionStoreError(c *gin.Context, err error) {
	var response *azcore.ResponseError
	if errors.As(err, &response) {
		switch response.StatusCode {
		case http.StatusNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
			return
		case http.StatusPreconditionFailed:
			writeTransactionConflict(c)
			return
		}
	}
	log.Printf("transaction write or read failed: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "could not access the transaction"})
}

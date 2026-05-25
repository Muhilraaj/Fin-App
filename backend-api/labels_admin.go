package main

import (
	"api/auth"
	"api/azcosmos-api"
	"api/cosmosconfig"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func requireAuth(c *gin.Context) bool {
	cookie, err := c.Cookie("token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return false
	}
	if _, err = auth.ValidateToken(cookie); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return false
	}
	return true
}

func setAdminCORS(c *gin.Context, methods string) {
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", methods)
	c.Header("Access-Control-Allow-Headers", "Content-Type")
}

func trimFields(body map[string]interface{}, fields ...string) map[string]string {
	out := make(map[string]string, len(fields))
	for _, field := range fields {
		out[field] = strings.TrimSpace(fmt.Sprint(body[field]))
	}
	return out
}

func nestedFields(body map[string]interface{}, key string, fields ...string) map[string]string {
	nested, ok := body[key].(map[string]interface{})
	if !ok {
		return trimFields(map[string]interface{}{})
	}
	return trimFields(nested, fields...)
}

func getAdminExpenseLabels(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	scope := c.DefaultQuery("scope", "regular")
	if scope != "regular" && scope != "construction" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scope must be regular or construction"})
		return
	}
	result := cosmosconfig.ListExpenseLabels(scope)
	setAdminCORS(c, "GET")
	c.JSON(http.StatusOK, result)
}

func postAdminExpenseLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	scope := c.DefaultQuery("scope", "regular")
	if scope != "regular" && scope != "construction" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scope must be regular or construction"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	fields := trimFields(body, "L1", "L2", "L3")
	if fields["L1"] == "" || fields["L2"] == "" || fields["L3"] == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "L1, L2, and L3 are required"})
		return
	}

	custom := ""
	if scope == "construction" {
		custom = "Construction"
	}

	existing := cosmosconfig.FindExpenseLabelByPath(fields["L1"], fields["L2"], fields["L3"], custom)
	if len(existing) > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "label path already exists"})
		return
	}

	item := map[string]interface{}{
		"id":     uuid.New().String(),
		"pk":     1,
		"L1":     fields["L1"],
		"L2":     fields["L2"],
		"L3":     fields["L3"],
		"Active": "Y",
	}
	if scope == "construction" {
		item["Custom"] = "Construction"
	}

	if err := cosmosconfig.CreateLabel(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create label"})
		return
	}

	setAdminCORS(c, "POST")
	c.JSON(http.StatusCreated, item)
}

func putAdminExpenseLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	id := c.Param("id")
	existing := cosmosconfig.GetLabelByID(id)
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "label not found"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	fields := trimFields(body, "L1", "L2", "L3")
	if fields["L1"] == "" || fields["L2"] == "" || fields["L3"] == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "L1, L2, and L3 are required"})
		return
	}

	custom := ""
	if val, ok := existing["Custom"]; ok && val != nil {
		custom = fmt.Sprint(val)
	}

	conflicts := cosmosconfig.FindExpenseLabelByPathExcludingID(fields["L1"], fields["L2"], fields["L3"], custom, id)
	if len(conflicts) > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "label path already exists"})
		return
	}

	existing["L1"] = fields["L1"]
	existing["L2"] = fields["L2"]
	existing["L3"] = fields["L3"]

	if err := cosmosconfig.ReplaceLabel(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update label"})
		return
	}

	setAdminCORS(c, "PUT")
	c.JSON(http.StatusOK, existing)
}

func patchAdminExpenseLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	scope := strings.TrimSpace(fmt.Sprint(body["scope"]))
	if scope == "" {
		scope = "regular"
	}
	if scope != "regular" && scope != "construction" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scope must be regular or construction"})
		return
	}

	level := strings.TrimSpace(fmt.Sprint(body["level"]))
	if level != "L1" && level != "L2" && level != "L3" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "level must be L1, L2, or L3"})
		return
	}

	id := strings.TrimSpace(fmt.Sprint(body["id"]))
	if level == "L3" && id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required for L3 rename"})
		return
	}

	from := nestedFields(body, "from", "L1", "L2", "L3")
	to := nestedFields(body, "to", "L1", "L2", "L3")

	switch level {
	case "L1":
		if from["L1"] == "" || to["L1"] == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "from.L1 and to.L1 are required"})
			return
		}
	case "L2":
		if from["L1"] == "" || from["L2"] == "" || to["L2"] == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "from.L1, from.L2, and to.L2 are required"})
			return
		}
	case "L3":
		if to["L3"] == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to.L3 is required"})
			return
		}
	}

	updated, err := cosmosconfig.RenameExpenseLabels(scope, level, id, from, to)
	if err != nil {
		if errors.Is(err, azcosmosapi.ErrTransactionalBatchTooLarge) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "label path already exists" || err.Error() == "label not found" || err.Error() == "no labels matched" {
			status := http.StatusConflict
			if err.Error() == "label not found" || err.Error() == "no labels matched" {
				status = http.StatusNotFound
			}
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to rename label"})
		return
	}

	setAdminCORS(c, "POST, PATCH")
	c.JSON(http.StatusOK, gin.H{"updatedCount": len(updated), "items": updated})
}

func deleteAdminExpenseLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	id := c.Param("id")
	existing := cosmosconfig.GetLabelByID(id)
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "label not found"})
		return
	}

	count := cosmosconfig.CountExpenseByLabelKey(id)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("label is used by %d transactions", count)})
		return
	}

	if err := cosmosconfig.DeleteLabel(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete label"})
		return
	}

	setAdminCORS(c, "DELETE")
	c.JSON(http.StatusOK, gin.H{"message": "label deleted"})
}

func getAdminIncomeLabels(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	result := cosmosconfig.ListIncomeLabels()
	setAdminCORS(c, "GET")
	c.JSON(http.StatusOK, result)
}

func postAdminIncomeLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	fields := trimFields(body, "L1", "L2")
	if fields["L1"] == "" || fields["L2"] == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "L1 and L2 are required"})
		return
	}

	existing := cosmosconfig.FindIncomeLabelByPath(fields["L1"], fields["L2"])
	if len(existing) > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "label path already exists"})
		return
	}

	item := map[string]interface{}{
		"id":     uuid.New().String(),
		"pk":     1,
		"L1":     fields["L1"],
		"L2":     fields["L2"],
		"Active": "Y",
	}

	if err := cosmosconfig.CreateIncomeLabel(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create label"})
		return
	}

	setAdminCORS(c, "POST")
	c.JSON(http.StatusCreated, item)
}

func putAdminIncomeLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	id := c.Param("id")
	existing := cosmosconfig.GetIncomeLabelByID(id)
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "label not found"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	fields := trimFields(body, "L1", "L2")
	if fields["L1"] == "" || fields["L2"] == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "L1 and L2 are required"})
		return
	}

	conflicts := cosmosconfig.FindIncomeLabelByPathExcludingID(fields["L1"], fields["L2"], id)
	if len(conflicts) > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "label path already exists"})
		return
	}

	existing["L1"] = fields["L1"]
	existing["L2"] = fields["L2"]

	if err := cosmosconfig.ReplaceIncomeLabel(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update label"})
		return
	}

	setAdminCORS(c, "PUT")
	c.JSON(http.StatusOK, existing)
}

func patchAdminIncomeLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	level := strings.TrimSpace(fmt.Sprint(body["level"]))
	if level != "L1" && level != "L2" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "level must be L1 or L2"})
		return
	}

	id := strings.TrimSpace(fmt.Sprint(body["id"]))
	if level == "L2" && id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required for L2 rename"})
		return
	}

	from := nestedFields(body, "from", "L1", "L2")
	to := nestedFields(body, "to", "L1", "L2")

	switch level {
	case "L1":
		if from["L1"] == "" || to["L1"] == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "from.L1 and to.L1 are required"})
			return
		}
	case "L2":
		if to["L2"] == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to.L2 is required"})
			return
		}
	}

	updated, err := cosmosconfig.RenameIncomeLabels(level, id, from, to)
	if err != nil {
		if errors.Is(err, azcosmosapi.ErrTransactionalBatchTooLarge) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "label path already exists" || err.Error() == "label not found" || err.Error() == "no labels matched" {
			status := http.StatusConflict
			if err.Error() == "label not found" || err.Error() == "no labels matched" {
				status = http.StatusNotFound
			}
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to rename label"})
		return
	}

	setAdminCORS(c, "POST, PATCH")
	c.JSON(http.StatusOK, gin.H{"updatedCount": len(updated), "items": updated})
}

func deleteAdminIncomeLabel(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	id := c.Param("id")
	if cosmosconfig.GetIncomeLabelByID(id) == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "label not found"})
		return
	}

	count := cosmosconfig.CountIncomeByLabelKey(id)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("label is used by %d transactions", count)})
		return
	}

	if err := cosmosconfig.DeleteIncomeLabel(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete label"})
		return
	}

	setAdminCORS(c, "DELETE")
	c.JSON(http.StatusOK, gin.H{"message": "label deleted"})
}

func registerAdminLabelRoutes(route *gin.Engine) {
	route.GET("api/manage-labels/expense", getAdminExpenseLabels)
	route.POST("api/manage-labels/expense", postAdminExpenseLabel)
	route.POST("api/manage-labels/expense/rename", patchAdminExpenseLabel)
	route.PATCH("api/manage-labels/expense", patchAdminExpenseLabel)
	route.PUT("api/manage-labels/expense/:id", putAdminExpenseLabel)
	route.DELETE("api/manage-labels/expense/:id", deleteAdminExpenseLabel)

	route.GET("api/manage-labels/income", getAdminIncomeLabels)
	route.POST("api/manage-labels/income", postAdminIncomeLabel)
	route.POST("api/manage-labels/income/rename", patchAdminIncomeLabel)
	route.PATCH("api/manage-labels/income", patchAdminIncomeLabel)
	route.PUT("api/manage-labels/income/:id", putAdminIncomeLabel)
	route.DELETE("api/manage-labels/income/:id", deleteAdminIncomeLabel)
}

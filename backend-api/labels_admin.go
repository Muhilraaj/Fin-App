package main

import (
	"api/auth"
	"api/cosmosconfig"
	"api/labelsync"
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

	custom := strings.TrimSpace(fmt.Sprint(body["Custom"]))
	scope := "regular"
	if custom == "Construction" {
		scope = "construction"
	}

	existing := cosmosconfig.FindExpenseLabelByPath(fields["L1"], fields["L2"], fields["L3"], custom)
	if len(existing) > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "label path already exists"})
		return
	}

	item := map[string]interface{}{
		"id": uuid.New().String(),
		"pk": 1,
		"L1": fields["L1"],
		"L2": fields["L2"],
		"L3": fields["L3"],
	}
	if custom != "" {
		item["Custom"] = custom
	}

	if err := cosmosconfig.CreateLabel(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create label"})
		return
	}
	if err := labelsync.RebuildExpenseScope(scope); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label created but blob sync failed"})
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
	scope := "regular"
	if custom == "Construction" {
		scope = "construction"
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
	if err := labelsync.RebuildExpenseScope(scope); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label updated but blob sync failed"})
		return
	}

	setAdminCORS(c, "PUT")
	c.JSON(http.StatusOK, existing)
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

	custom := ""
	if val, ok := existing["Custom"]; ok && val != nil {
		custom = fmt.Sprint(val)
	}
	scope := "regular"
	if custom == "Construction" {
		scope = "construction"
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
	if err := labelsync.RebuildExpenseScope(scope); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label deleted but blob sync failed"})
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
		"id": uuid.New().String(),
		"pk": 1,
		"L1": fields["L1"],
		"L2": fields["L2"],
	}

	if err := cosmosconfig.CreateIncomeLabel(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create label"})
		return
	}
	if err := labelsync.RebuildIncomeBlob(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label created but blob sync failed"})
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
	if err := labelsync.RebuildIncomeBlob(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label updated but blob sync failed"})
		return
	}

	setAdminCORS(c, "PUT")
	c.JSON(http.StatusOK, existing)
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
	if err := labelsync.RebuildIncomeBlob(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "label deleted but blob sync failed"})
		return
	}

	setAdminCORS(c, "DELETE")
	c.JSON(http.StatusOK, gin.H{"message": "label deleted"})
}

func registerAdminLabelRoutes(route *gin.Engine) {
	route.GET("api/manage-labels/expense", getAdminExpenseLabels)
	route.POST("api/manage-labels/expense", postAdminExpenseLabel)
	route.PUT("api/manage-labels/expense/:id", putAdminExpenseLabel)
	route.DELETE("api/manage-labels/expense/:id", deleteAdminExpenseLabel)

	route.GET("api/manage-labels/income", getAdminIncomeLabels)
	route.POST("api/manage-labels/income", postAdminIncomeLabel)
	route.PUT("api/manage-labels/income/:id", putAdminIncomeLabel)
	route.DELETE("api/manage-labels/income/:id", deleteAdminIncomeLabel)
}

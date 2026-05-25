package main

import (
	"api/cosmosconfig"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func getAdminOnBehalfUsers(c *gin.Context) {
	if !requireAuth(c) {
		return
	}
	result := cosmosconfig.ListOnBehalfUsers()
	setAdminCORS(c, "GET")
	c.JSON(http.StatusOK, result)
}

func postAdminOnBehalfUser(c *gin.Context) {
	if !requireAuth(c) {
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	name := strings.TrimSpace(fmt.Sprint(body["name"]))
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	item, err := cosmosconfig.CreateOnBehalf(name)
	if err != nil {
		if err.Error() == "on-behalf user already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create on-behalf user"})
		return
	}

	setAdminCORS(c, "POST")
	c.JSON(http.StatusCreated, item)
}

func putAdminOnBehalfUser(c *gin.Context) {
	if !requireAuth(c) {
		return
	}

	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	name := strings.TrimSpace(fmt.Sprint(body["name"]))
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	item, err := cosmosconfig.UpdateOnBehalf(id, name)
	if err != nil {
		switch err.Error() {
		case "on-behalf user not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "on-behalf user already exists":
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update on-behalf user"})
		}
		return
	}

	setAdminCORS(c, "PUT")
	c.JSON(http.StatusOK, item)
}

func registerAdminOnBehalfRoutes(route *gin.Engine) {
	route.GET("api/manage-onbehalf", getAdminOnBehalfUsers)
	route.POST("api/manage-onbehalf", postAdminOnBehalfUser)
	route.PUT("api/manage-onbehalf/:id", putAdminOnBehalfUser)
}

package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/gin-gonic/gin"
)

// UpdatePointRequest - Request body for /updpoint/:id
type UpdatePointRequest struct {
	Status   *string  `json:"status"`
	KwhPrice *float64 `json:"kwhprice"`
}

// UpdatePointResponse - Response body for /updpoint/:id
type UpdatePointResponse struct {
	PointID  string  `json:"pointid"`
	Status   string  `json:"status"`
	KwhPrice float64 `json:"kwhprice"`
}

// UpdatePoint handles POST /updpoint/:id
func UpdatePoint(c *gin.Context) {
	pointID := c.Param("id")

	var req UpdatePointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}

	// At least one of status or kwhprice must be provided
	if req.Status == nil && req.KwhPrice == nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "At least one of 'status' or 'kwhprice' must be provided")
		return
	}

	db := repository.DB

	// Check if charger exists
	var charger models.Charger
	if err := db.First(&charger, "charger_id = ?", pointID).Error; err != nil {
		sendError(c, http.StatusNotFound, "Not Found", fmt.Sprintf("Point %s not found", pointID))
		return
	}

	// Validate status if provided
	if req.Status != nil {
		validStatuses := map[string]bool{
			"available": true, "charging": true, "reserved": true,
			"malfunction": true, "offline": true,
		}
		if !validStatuses[*req.Status] {
			sendError(c, http.StatusBadRequest, "Bad Request", "Invalid status value. Must be one of: available, charging, reserved, malfunction, offline")
			return
		}
	}

	// Build update map
	updates := make(map[string]interface{})
	oldStatus := string(charger.Status)
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.KwhPrice != nil {
		updates["kwh_price"] = *req.KwhPrice
	}

	// Update charger
	if err := db.Model(&charger).Updates(updates).Error; err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Log status change if status was updated
	if req.Status != nil && oldStatus != *req.Status {
		db.Exec(`
			INSERT INTO status_changes (charger_id, old_status, new_status, changed_at)
			VALUES (?, ?, ?, NOW())
		`, pointID, oldStatus, *req.Status)
	}

	// Reload charger for response
	db.First(&charger, "charger_id = ?", pointID)

	c.JSON(http.StatusOK, UpdatePointResponse{
		PointID:  pointID,
		Status:   string(charger.Status),
		KwhPrice: charger.KwhPrice,
	})
}

package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/gin-gonic/gin"
)

// UpdatePointRequest represents the request body for updating a charging point
// @Description Request body for updating charging point properties
type UpdatePointRequest struct {
	// Status of the charging point (available, charging, reserved, malfunction, offline)
	Status *string `json:"status" example:"available"`
	// Price per kWh in the local currency
	KwhPrice *float64 `json:"kwhprice" example:"0.35"`
	// Whether the price is manually set or dynamically calculated
	IsManualPrice *bool `json:"is_manual_price" example:"true"`
}

// UpdatePointResponse represents the response after updating a charging point
// @Description Response body containing the updated charging point details
type UpdatePointResponse struct {
	// Unique identifier of the charging point
	PointID string `json:"pointid" example:"123"`
	// Current status of the charging point
	Status string `json:"status" example:"available"`
	// Current price per kWh
	KwhPrice float64 `json:"kwhprice" example:"0.35"`
	// Indicates if the price is manually set
	IsManualPrice bool `json:"is_manual_price" example:"true"`
}

// UpdatePoint godoc
// @Summary Update a charging point
// @Description Updates the properties of a specific charging point including status, price, and pricing mode.
// @Description At least one field (status, kwhprice, or is_manual_price) must be provided.
// @Description When setting kwhprice without specifying is_manual_price, it defaults to manual pricing mode.
// @Tags Points
// @Accept json
// @Produce json
// @Param id path string true "Charging Point ID"
// @Param request body UpdatePointRequest true "Update request body"
// @Success 200 {object} UpdatePointResponse "Successfully updated charging point"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Invalid input or missing required fields"
// @Failure 404 {object} ErrorLogResponse "Not Found - Charging point does not exist"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /updpoint/{id} [post]
func UpdatePoint(c *gin.Context) {
	pointID := c.Param("id")

	var req UpdatePointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}

	// At least one field must be provided
	if req.Status == nil && req.KwhPrice == nil && req.IsManualPrice == nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "At least one of 'status', 'kwhprice' or 'is_manual_price' must be provided")
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
		// If admin sets a price, we default to manual mode unless they explicitly said otherwise
		if req.IsManualPrice == nil {
			updates["is_manual_price"] = true
		}
	}

	if req.IsManualPrice != nil {
		updates["is_manual_price"] = *req.IsManualPrice
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
		PointID:       pointID,
		Status:        string(charger.Status),
		KwhPrice:      charger.KwhPrice,
		IsManualPrice: charger.IsManualPrice,
	})
}

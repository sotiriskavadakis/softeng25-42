package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"time"

	"github.com/gin-gonic/gin"
)

// PointDetailDTO represents detailed information about a single charging point
// @Description Detailed response containing all information about a specific charging point
type PointDetailDTO struct {
	// Unique identifier of the charging point
	PointID string `json:"pointid" example:"123"`
	// Longitude coordinate of the charging point location
	Lon string `json:"lon" example:"23.727539"`
	// Latitude coordinate of the charging point location
	Lat string `json:"lat" example:"37.983810"`
	// Current status of the charging point (available, charging, reserved, malfunction, offline)
	Status string `json:"status" example:"available"`
	// Maximum charging capacity in kW
	Cap int `json:"cap" example:"22"`
	// End time of current reservation (current time if not reserved)
	ReservationEndTime string `json:"reservationendtime" example:"2025-12-25 14:30"`
	// Current price per kWh in local currency
	KwhPrice float64 `json:"kwhprice" example:"0.35"`
	// Whether the price is manually set or dynamically calculated
	IsManualPrice bool `json:"is_manual_price" example:"false"`
}

// GetPointByID godoc
// @Summary Get charging point by ID
// @Description Retrieves detailed information about a specific charging point including
// @Description location coordinates, current status, capacity, pricing, and reservation details.
// @Tags Points
// @Accept json
// @Produce json
// @Param id path string true "Charging Point ID"
// @Success 200 {object} PointDetailDTO "Successfully retrieved charging point details"
// @Failure 404 {object} ErrorLogResponse "Not Found - Charging point does not exist"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /getpoint/{id} [get]
func GetPointByID(c *gin.Context) {
	// 1. Λήψη του ID από το URL
	pointID := c.Param("id")

	db := repository.DB

	// 2. Raw query to get charger with location data
	var result struct {
		ChargerID     uint
		StationID     uint
		Status        string
		MaxPowerKw    float64
		Latitude      float64
		Longitude     float64
		KwhPrice      float64
		IsManualPrice bool
	}

	err := db.Raw(`
		SELECT 
			c.charger_id,
			c.status,
			c.max_power_kw,
			c.kwh_price,
			c.is_manual_price,
			l.latitude,
			l.longitude
		FROM chargers c
		JOIN stations s ON c.station_id = s.station_id
		JOIN locations l ON s.location_id = l.location_id
		WHERE c.charger_id = ?
	`, pointID).Scan(&result).Error

	if err != nil {
		sendError(c, 500, "Database Error", err.Error())
		return
	}

	if result.ChargerID == 0 {
		sendError(c, 404, "Not Found", fmt.Sprintf("Point with ID %s not found", pointID))
		return
	}

	// If not reserved, return current time per spec
	reservationEndTime := time.Now().Format("2006-01-02 15:04")

	response := PointDetailDTO{
		PointID:            fmt.Sprintf("%d", result.ChargerID),
		Lon:                fmt.Sprintf("%f", result.Longitude),
		Lat:                fmt.Sprintf("%f", result.Latitude),
		Status:             result.Status,
		Cap:                int(result.MaxPowerKw),
		ReservationEndTime: reservationEndTime,
		KwhPrice:           result.KwhPrice,
		IsManualPrice:      result.IsManualPrice,
	}

	// 5. Return JSON
	c.JSON(http.StatusOK, response)
}

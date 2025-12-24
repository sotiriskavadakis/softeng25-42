package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"time"

	"github.com/gin-gonic/gin"
)

// Χρησιμοποιούμε το ίδιο struct με το GetPoints για συνέπεια
// (Αν χρειάζεσαι περισσότερα πεδία για το single point, φτιάξε ένα PointDetailDTO)
type PointDetailDTO struct {
	PointID            string `json:"pointid"`
	Lon                string `json:"lon"`
	Lat                string `json:"lat"`
	Status             string `json:"status"`
	Cap                int    `json:"cap"`
	ReservationEndTime string `json:"reservationendtime"`
	KwhPrice           string `json:"kwh_price,omitempty"`
}

func GetPointByID(c *gin.Context) {
	// 1. Λήψη του ID από το URL
	pointID := c.Param("id")

	db := repository.DB

	// 2. Raw query to get charger with location data
	var result struct {
		ChargerID  uint
		StationID  uint
		Status     string
		MaxPowerKw float64
		Latitude   float64
		Longitude  float64
	}

	err := db.Raw(`
		SELECT 
			c.charger_id,
			c.status,
			c.max_power_kw,
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
	reservationEndTime := time.Now().Format("2006-01-02 15:04:05")

	response := PointDetailDTO{
		PointID:            fmt.Sprintf("%d", result.ChargerID),
		Lon:                fmt.Sprintf("%f", result.Longitude),
		Lat:                fmt.Sprintf("%f", result.Latitude),
		Status:             result.Status,
		Cap:                int(result.MaxPowerKw),
		ReservationEndTime: reservationEndTime,
		KwhPrice:           "0.30",
	}

	// 5. Return JSON
	c.JSON(http.StatusOK, response)
}

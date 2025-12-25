package handlers

import (
	"encoding/json"
	"net/http"

	"softeng25-42/back-end/internal/models"     // Update with your actual module name
	"softeng25-42/back-end/internal/repository" // Update with your actual module name
)

// HealthCheckResponse represents the health status of the API and database
// @Description Response containing system health information and charging point statistics
type HealthCheckResponse struct {
	// Overall system status (OK if healthy)
	Status string `json:"status" example:"OK"`
	// Database connection string (DSN)
	DbConnection string `json:"dbconnection" example:"postgres://user:***@localhost:5432/evcharging"`
	// Total number of charging points in the system
	NChargePoints int64 `json:"n_charge_points" example:"1500"`
	// Number of online charging points (available, charging, reserved, malfunction)
	NChargePointsOnline int64 `json:"n_charge_points_online" example:"1420"`
	// Number of offline charging points
	NChargePointsOffline int64 `json:"n_charge_points_offline" example:"80"`
}

// HealthCheck godoc
// @Summary Check API health status
// @Description Performs a health check of the API including database connectivity verification
// @Description and retrieval of charging point statistics. Returns system status and counts of
// @Description online vs offline charging points.
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} HealthCheckResponse "System is healthy"
// @Failure 400 {object} ErrorLogResponse "Database connection failed or query error"
// @Router /healthcheck [get]
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// 1. Get the DB instance
	db := repository.DB

	// 2. Check Database Connectivity
	sqlDB, err := db.DB()
	if err != nil || sqlDB.Ping() != nil {
		sendErrorHTTP(w, r, 400, "Database connection failed", "Could not ping database")
		return
	}

	// 3. Gather Statistics using GORM
	var totalCount int64
	var offlineCount int64

	// Count total points
	if err := db.Model(&models.Charger{}).Count(&totalCount).Error; err != nil {
		sendErrorHTTP(w, r, 400, "Database error", err.Error())
		return
	}

	// Count offline points (Status = 'offline')
	// Note: The PDF implies 'online' is everything NOT offline (available, charging, reserved, malfunction)
	if err := db.Model(&models.Charger{}).Where("status = ?", "OFFLINE").Count(&offlineCount).Error; err != nil {
		sendErrorHTTP(w, r, 400, "Database error", err.Error())
		return
	}

	onlineCount := totalCount - offlineCount

	// 4. Construct Success Response
	response := HealthCheckResponse{
		Status:               "OK",
		DbConnection:         repository.DSN,
		NChargePoints:        totalCount,
		NChargePointsOnline:  onlineCount,
		NChargePointsOffline: offlineCount,
	}

	// 5. Send JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

package handlers

import (
	"encoding/json"
	"net/http"

	"softeng25-42/back-end/internal/models"     // Update with your actual module name
	"softeng25-42/back-end/internal/repository" // Update with your actual module name
)

// HealthCheckResponse matches the success body required by the PDF
type HealthCheckResponse struct {
	Status               string `json:"status"`
	DbConnection         string `json:"dbconnection"`
	NChargePoints        int64  `json:"n_charge_points"`
	NChargePointsOnline  int64  `json:"n_charge_points_online"` // "Online" = available, charging, reserved, malfunction
	NChargePointsOffline int64  `json:"n_charge_points_offline"`
}


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


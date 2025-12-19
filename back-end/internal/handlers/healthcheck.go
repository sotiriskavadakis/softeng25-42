package handlers

import (
	"encoding/json"
	"net/http"
	"time"

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

// ErrorLogResponse matches the error object required for 400/404/500 responses
type ErrorLogResponse struct {
	Call       string `json:"call"`
	TimeRef    string `json:"timeref"`
	Originator string `json:"originator"`
	ReturnCode int    `json:"return code"`
	Error      string `json:"error"`
	DebugInfo  string `json:"debuginfo"`
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// 1. Get the DB instance
	db := repository.DB

	// 2. Check Database Connectivity
	sqlDB, err := db.DB()
	if err != nil || sqlDB.Ping() != nil {
		sendError(w, r, 400, "Database connection failed", "Could not ping database")
		return
	}

	// 3. Gather Statistics using GORM
	var totalCount int64
	var offlineCount int64

	// Count total points
	if err := db.Model(&models.Charger{}).Count(&totalCount).Error; err != nil {
		sendError(w, r, 500, "Database error", err.Error())
		return
	}

	// Count offline points (Status = 'offline')
	// Note: The PDF implies 'online' is everything NOT offline (available, charging, reserved, malfunction)
	if err := db.Model(&models.Charger{}).Where("status = ?", "OFFLINE").Count(&offlineCount).Error; err != nil {
		sendError(w, r, 500, "Database error", err.Error())
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

// Helper to format the Error Log exactly as requested [cite: 31, 42]
func sendError(w http.ResponseWriter, r *http.Request, code int, errTitle string, debugInfo string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	errResponse := ErrorLogResponse{
		Call:       r.URL.String(),
		TimeRef:    time.Now().Format("2006-01-02 15:04"), // Format requested in PDF
		Originator: r.RemoteAddr,
		ReturnCode: code,
		Error:      errTitle,
		DebugInfo:  debugInfo,
	}

	json.NewEncoder(w).Encode(errResponse)
}

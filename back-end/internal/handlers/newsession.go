package handlers

import (
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"time"

	"github.com/gin-gonic/gin"
)

// NewSessionRequest represents the request body for creating a new charging session
// @Description Request body containing all details of a completed charging session
type NewSessionRequest struct {
	// ID of the charging point where the session occurred
	PointID string `json:"pointid" binding:"required" example:"123"`
	// Session start time in format 'YYYY-MM-DD HH:MM'
	StartTime string `json:"starttime" binding:"required" example:"2025-12-25 10:00"`
	// Session end time in format 'YYYY-MM-DD HH:MM'
	EndTime string `json:"endtime" binding:"required" example:"2025-12-25 11:30"`
	// Battery state of charge at session start (percentage 0-100)
	StartSoc int `json:"startsoc" binding:"required" example:"20"`
	// Battery state of charge at session end (percentage 0-100)
	EndSoc int `json:"endsoc" binding:"required" example:"80"`
	// Total energy delivered during the session in kWh
	TotalKwh float64 `json:"totalkwh" binding:"required" example:"45.5"`
	// Price per kWh at the time of the session
	KwhPrice float64 `json:"kwhprice" binding:"required" example:"0.35"`
	// Total amount charged for the session in local currency
	Amount float64 `json:"amount" binding:"required" example:"15.93"`
	// ID of the payment intent from Stripe
	PaymentIntentID string `json:"payment_intent_id" binding:"required"`
}

// NewSession godoc
// @Summary Create a new charging session
// @Description Records a new completed charging session with all relevant details including
// @Description start/end times, energy delivered, state of charge changes, and billing information.
// @Tags Sessions
// @Accept json
// @Produce json
// @Param request body NewSessionRequest true "Charging session details"
// @Success 200 "Successfully created charging session (empty body)"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Missing required fields or invalid timestamp format"
// @Failure 404 {object} ErrorLogResponse "Not Found - Charging point does not exist"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /newsession [post]
func NewSession(c *gin.Context) {
	var req NewSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}

	// Parse timestamps (format: "YYYY-MM-DD HH:MM")
	startTime, err := time.Parse("2006-01-02 15:04", req.StartTime)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid starttime format. Use 'YYYY-MM-DD HH:MM'")
		return
	}
	endTime, err := time.Parse("2006-01-02 15:04", req.EndTime)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid endtime format. Use 'YYYY-MM-DD HH:MM'")
		return
	}

	db := repository.DB

	// Check if charger exists
	var exists int64
	db.Raw("SELECT COUNT(*) FROM chargers WHERE charger_id = ?", req.PointID).Scan(&exists)
	if exists == 0 {
		sendError(c, http.StatusNotFound, "Not Found", "Point not found")
		return
	}

	// Insert charging session
	err = db.Exec(`
		INSERT INTO charging_sessions 
		(charger_id, start_time, end_time, start_soc, end_soc, total_kwh, kwh_price, amount, payment_intent_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.PointID, startTime, endTime, req.StartSoc, req.EndSoc, req.TotalKwh, req.KwhPrice, req.Amount, req.PaymentIntentID).Error

	if err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Return empty body with 200 OK per spec
	c.Status(http.StatusOK)
}

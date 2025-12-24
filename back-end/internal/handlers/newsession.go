package handlers

import (
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"time"

	"github.com/gin-gonic/gin"
)

// NewSessionRequest - Request body for /newsession
type NewSessionRequest struct {
	PointID   string  `json:"pointid" binding:"required"`
	StartTime string  `json:"starttime" binding:"required"`
	EndTime   string  `json:"endtime" binding:"required"`
	StartSoc  int     `json:"startsoc" binding:"required"`
	EndSoc    int     `json:"endsoc" binding:"required"`
	TotalKwh  float64 `json:"totalkwh" binding:"required"`
	KwhPrice  float64 `json:"kwhprice" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
}

// NewSession handles POST /newsession
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
		(charger_id, start_time, end_time, start_soc, end_soc, total_kwh, kwh_price, amount)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, req.PointID, startTime, endTime, req.StartSoc, req.EndSoc, req.TotalKwh, req.KwhPrice, req.Amount).Error

	if err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Return empty body with 200 OK per spec
	c.Status(http.StatusOK)
}

package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SessionDTO represents a charging session record
// @Description Details of a completed charging session including timing, energy, and billing information
type SessionDTO struct {
	// Start time of the charging session (format: YYYY-MM-DD HH:MM)
	StartTime string `json:"starttime" example:"2025-12-25 10:00"`
	// End time of the charging session (format: YYYY-MM-DD HH:MM)
	EndTime string `json:"endtime" example:"2025-12-25 11:30"`
	// Battery state of charge at session start (percentage 0-100)
	StartSoc int `json:"startsoc" example:"20"`
	// Battery state of charge at session end (percentage 0-100)
	EndSoc int `json:"endsoc" example:"80"`
	// Total energy delivered during the session in kWh
	TotalKwh float64 `json:"totalkwh" example:"45.5"`
	// Price per kWh at the time of the session
	KwhPrice float64 `json:"kwhprice" example:"0.35"`
	// Total amount charged for the session in local currency
	Amount float64 `json:"amount" example:"15.93"`
}

// GetSessions godoc
// @Summary Get charging sessions for a point
// @Description Retrieves all charging sessions for a specific charging point within a date range.
// @Description Sessions are ordered by start time in descending order (most recent first).
// @Description Results can be returned in JSON or CSV format.
// @Tags Sessions
// @Accept json
// @Produce json,text/csv
// @Param id path string true "Charging Point ID"
// @Param from path string true "Start date in YYYYMMDD format" example(20251201)
// @Param to path string true "End date in YYYYMMDD format (inclusive)" example(20251225)
// @Param format query string false "Response format (json or csv)" default(json)
// @Success 200 {array} SessionDTO "Successfully retrieved charging sessions"
// @Success 204 "No Content - No sessions found in the specified date range"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Invalid date format"
// @Failure 404 {object} ErrorLogResponse "Not Found - Charging point does not exist"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /sessions/{id}/{from}/{to} [get]
func GetSessions(c *gin.Context) {
	pointID := c.Param("id")
	fromStr := c.Param("from")
	toStr := c.Param("to")

	// Parse dates (format: YYYYMMDD)
	fromDate, err := time.Parse("20060102", fromStr)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid 'from' date format. Use YYYYMMDD")
		return
	}
	toDate, err := time.Parse("20060102", toStr)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid 'to' date format. Use YYYYMMDD")
		return
	}
	// Include the entire 'to' day
	toDate = toDate.Add(24*time.Hour - time.Second)

	db := repository.DB

	// Check if charger exists
	var exists int64
	db.Raw("SELECT COUNT(*) FROM chargers WHERE charger_id = ?", pointID).Scan(&exists)
	if exists == 0 {
		sendError(c, http.StatusNotFound, "Not Found", "Point not found")
		return
	}

	var sessions []struct {
		StartTime time.Time
		EndTime   time.Time
		StartSoc  int
		EndSoc    int
		TotalKwh  float64
		KwhPrice  float64
		Amount    float64
	}

	err = db.Raw(`
		SELECT start_time, end_time, start_soc, end_soc, total_kwh, kwh_price, amount
		FROM charging_sessions
		WHERE charger_id = ? AND start_time >= ? AND start_time <= ?
		ORDER BY start_time DESC
	`, pointID, fromDate, toDate).Scan(&sessions).Error

	if err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Return 204 No Content if no sessions found
	if len(sessions) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	// Build response
	result := make([]SessionDTO, len(sessions))
	for i, s := range sessions {
		result[i] = SessionDTO{
			StartTime: s.StartTime.Format("2006-01-02 15:04"),
			EndTime:   s.EndTime.Format("2006-01-02 15:04"),
			StartSoc:  s.StartSoc,
			EndSoc:    s.EndSoc,
			TotalKwh:  s.TotalKwh,
			KwhPrice:  s.KwhPrice,
			Amount:    s.Amount,
		}
	}

	// Check format parameter (default: json for API)
	format := c.DefaultQuery("format", "json")
	if strings.ToLower(format) == "csv" {
		c.Header("Content-Type", "text/csv")
		c.String(http.StatusOK, sessionsToCSV(result))
		return
	}

	c.JSON(http.StatusOK, result)
}

func sessionsToCSV(sessions []SessionDTO) string {
	var sb strings.Builder
	sb.WriteString("starttime,endtime,startsoc,endsoc,totalkwh,kwhprice,amount\n")
	for _, s := range sessions {
		sb.WriteString(fmt.Sprintf("%s,%s,%d,%d,%.2f,%.2f,%.2f\n",
			s.StartTime, s.EndTime, s.StartSoc, s.EndSoc, s.TotalKwh, s.KwhPrice, s.Amount))
	}
	return sb.String()
}

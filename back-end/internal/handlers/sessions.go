package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SessionDTO - Response item for /sessions/:id/:from/:to
type SessionDTO struct {
	StartTime string  `json:"starttime"`
	EndTime   string  `json:"endtime"`
	StartSoc  int     `json:"startsoc"`
	EndSoc    int     `json:"endsoc"`
	TotalKwh  float64 `json:"totalkwh"`
	KwhPrice  float64 `json:"kwhprice"`
	Amount    float64 `json:"amount"`
}

// GetSessions handles GET /sessions/:id/:from/:to
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

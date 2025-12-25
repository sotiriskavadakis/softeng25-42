package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/repository"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// StatusChangeDTO represents a single status change event for a charging point
// @Description Record of a status change event including timestamp and state transition
type StatusChangeDTO struct {
	// Timestamp when the status change occurred (format: YYYY-MM-DD HH:MM)
	TimeRef string `json:"timeref" example:"2025-12-25 14:30"`
	// Previous status before the change
	OldState string `json:"old_state" example:"available"`
	// New status after the change
	NewState string `json:"new_state" example:"charging"`
}

// GetPointStatus godoc
// @Summary Get status change history for a charging point
// @Description Retrieves the history of status changes for a specific charging point within a date range.
// @Description Status changes are logged whenever a point transitions between states (e.g., available → charging).
// @Description Results can be returned in JSON or CSV format.
// @Tags Points
// @Accept json
// @Produce json,text/csv
// @Param pointid path string true "Charging Point ID"
// @Param from path string true "Start date in YYYYMMDD format" example(20251201)
// @Param to path string true "End date in YYYYMMDD format (inclusive)" example(20251225)
// @Param format query string false "Response format (json or csv)" default(json)
// @Success 200 {array} StatusChangeDTO "Successfully retrieved status change history"
// @Success 204 "No Content - No status changes found in the specified date range"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Invalid date format"
// @Failure 404 {object} ErrorLogResponse "Not Found - Charging point does not exist"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /pointstatus/{pointid}/{from}/{to} [get]
func GetPointStatus(c *gin.Context) {
	pointID := c.Param("pointid")
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

	var changes []struct {
		ChangedAt time.Time
		OldStatus string
		NewStatus string
	}

	err = db.Raw(`
		SELECT changed_at, old_status, new_status
		FROM status_changes
		WHERE charger_id = ? AND changed_at >= ? AND changed_at <= ?
		ORDER BY changed_at DESC
	`, pointID, fromDate, toDate).Scan(&changes).Error

	if err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Return 204 No Content if no changes found
	if len(changes) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	// Build response
	result := make([]StatusChangeDTO, len(changes))
	for i, ch := range changes {
		result[i] = StatusChangeDTO{
			TimeRef:  ch.ChangedAt.Format("2006-01-02 15:04"),
			OldState: ch.OldStatus,
			NewState: ch.NewStatus,
		}
	}

	// Check format parameter (default: json for API)
	format := c.DefaultQuery("format", "json")
	if strings.ToLower(format) == "csv" {
		c.Header("Content-Type", "text/csv")
		c.String(http.StatusOK, statusChangesToCSV(result))
		return
	}

	c.JSON(http.StatusOK, result)
}

func statusChangesToCSV(changes []StatusChangeDTO) string {
	var sb strings.Builder
	sb.WriteString("timeref,old_state,new_state\n")
	for _, ch := range changes {
		sb.WriteString(fmt.Sprintf("%s,%s,%s\n", ch.TimeRef, ch.OldState, ch.NewState))
	}
	return sb.String()
}

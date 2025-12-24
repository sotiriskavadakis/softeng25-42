package handlers

import (
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	DefaultReservationMinutes = 30
	MaxReservationMinutes     = 60
	MinReservationMinutes     = 15
)

// ReserveResponseDTO - Response format per API spec
type ReserveResponseDTO struct {
	PointID            string `json:"pointid"`
	Status             string `json:"status"`
	ReservationEndTime string `json:"reservationendtime"`
}

// ReservePoint handles POST /reserve/:id and /reserve/:id/:minutes
func ReservePoint(c *gin.Context) {
	// 1. Parse point ID
	pointIDStr := c.Param("id")
	pointID, err := strconv.ParseUint(pointIDStr, 10, 32)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid point ID")
		return
	}

	// 2. Parse minutes (default 30, max 60, min 15)
	minutes := DefaultReservationMinutes
	minutesStr := c.Param("minutes")
	if minutesStr != "" {
		parsedMinutes, err := strconv.Atoi(minutesStr)
		if err == nil {
			minutes = parsedMinutes
		}
	}

	// Clamp to valid range [15, 60]
	if minutes < MinReservationMinutes {
		minutes = MinReservationMinutes
	}
	if minutes > MaxReservationMinutes {
		minutes = MaxReservationMinutes
	}

	db := repository.DB

	// 3. Check if charger exists and is available (with transaction for atomicity)
	tx := db.Begin()
	if tx.Error != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", tx.Error.Error())
		return
	}

	var charger models.Charger
	// Lock the row for update to prevent race conditions
	if err := tx.Raw(`
		SELECT charger_id, status 
		FROM chargers 
		WHERE charger_id = ? 
		FOR UPDATE
	`, pointID).Scan(&charger).Error; err != nil {
		tx.Rollback()
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// Charger not found
	if charger.ID == 0 {
		tx.Rollback()
		c.JSON(http.StatusOK, ReserveResponseDTO{
			PointID:            pointIDStr,
			Status:             "not_found",
			ReservationEndTime: "1970-01-01 00:00",
		})
		return
	}

	// Check if charger is available
	if charger.Status != models.StatusAvailable {
		tx.Rollback()
		c.JSON(http.StatusOK, ReserveResponseDTO{
			PointID:            pointIDStr,
			Status:             string(charger.Status),
			ReservationEndTime: "1970-01-01 00:00",
		})
		return
	}

	// 4. Calculate reservation end time
	now := time.Now()
	endTime := now.Add(time.Duration(minutes) * time.Minute)

	// 5. Update charger status to RESERVED
	if err := tx.Exec(`
		UPDATE chargers 
		SET status = ? 
		WHERE charger_id = ?
	`, models.StatusReserved, pointID).Error; err != nil {
		tx.Rollback()
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 6. Create reservation record (without user_id until auth is implemented)
	if err := tx.Exec(`
		INSERT INTO reservations (charger_id, start_time, duration_minutes)
		VALUES (?, ?, ?)
	`, pointID, now, minutes).Error; err != nil {
		tx.Rollback()
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 7. Commit transaction
	if err := tx.Commit().Error; err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 8. Return success response
	c.JSON(http.StatusOK, ReserveResponseDTO{
		PointID:            fmt.Sprintf("%d", pointID),
		Status:             "reserved",
		ReservationEndTime: endTime.Format("2006-01-02 15:04"),
	})
}

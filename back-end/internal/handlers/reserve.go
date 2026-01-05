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
	// DefaultReservationMinutes is the default reservation duration if not specified
	DefaultReservationMinutes = 30
	// MaxReservationMinutes is the maximum allowed reservation duration
	MaxReservationMinutes = 60
	// MinReservationMinutes is the minimum allowed reservation duration
	MinReservationMinutes = 15
)

// ReserveResponseDTO represents the response after a reservation attempt
// @Description Response containing the result of a reservation request
type ReserveResponseDTO struct {
	// ID of the charging point
	PointID string `json:"pointid" example:"123"`
	// Result status: 'reserved' if successful, 'not_found' if point doesn't exist,
	// or current status if point is not available for reservation
	Status string `json:"status" example:"reserved"`
	// End time of the reservation (format: YYYY-MM-DD HH:MM), or '1970-01-01 00:00' if reservation failed
	ReservationEndTime string `json:"reservationendtime" example:"2025-12-25 15:00"`
}

// ReservePoint godoc
// @Summary Reserve a charging point
// @Description Attempts to reserve a charging point for a specified duration.
// @Description The reservation duration must be between 15 and 60 minutes (defaults to 30 if not specified).
// @Description Only 'available' charging points can be reserved.
// @Description The operation is atomic and uses row-level locking to prevent race conditions.
// @Tags Reservations
// @Accept json
// @Produce json
// @Param id path string true "Charging Point ID"
// @Param minutes path int false "Reservation duration in minutes (15-60, default: 30)"
// @Success 200 {object} ReserveResponseDTO "Reservation result (check status field for success/failure reason)"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Invalid point ID"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /reserve/{id} [post]
// @Router /reserve/{id}/{minutes} [post]
func ReservePoint(c *gin.Context) {
	// 1. Parse point ID
	pointIDStr := c.Param("id")
	pointID, err := strconv.ParseUint(pointIDStr, 10, 32)
	if err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", "Invalid point ID")
		return
	}

	// 2. Get user ID from auth context (set by AuthRequired middleware)
	userID, exists := c.Get("authUserID")
	if !exists {
		sendError(c, http.StatusUnauthorized, "Unauthorized", "User ID not found in token")
		return
	}

	// 3. Parse minutes (default 30, max 60, min 15)
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

	// 4. Check if charger exists and is available (with transaction for atomicity)
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

	// 5. Calculate reservation end time
	now := time.Now()
	endTime := now.Add(time.Duration(minutes) * time.Minute)

	// 6. Update charger status to RESERVED
	if err := tx.Exec(`
		UPDATE chargers 
		SET status = ? 
		WHERE charger_id = ?
	`, models.StatusReserved, pointID).Error; err != nil {
		tx.Rollback()
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 7. Create reservation record with user ID from auth token
	if err := tx.Exec(`
		INSERT INTO reservations (charger_id, usr_id, start_time, duration_minutes)
		VALUES (?, ?, ?, ?)
	`, pointID, userID, now, minutes).Error; err != nil {
		tx.Rollback()
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 8. Commit transaction
	if err := tx.Commit().Error; err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	// 9. Return success response
	c.JSON(http.StatusOK, ReserveResponseDTO{
		PointID:            fmt.Sprintf("%d", pointID),
		Status:             "reserved",
		ReservationEndTime: endTime.Format("2006-01-02 15:04"),
	})
}

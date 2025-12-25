package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/gin-gonic/gin"
)

// PointVague represents a summary view of a charging point
// @Description Summary information about a charging point for list views
type PointVague struct {
	// Name of the charging network provider
	ProviderName string `json:"providerΝame" example:"EMPower"`
	// Unique identifier of the charging point
	PointID string `json:"pointid" example:"123"`
	// Longitude coordinate of the charging point
	Long string `json:"lon" example:"23.727539"`
	// Latitude coordinate of the charging point
	Lat string `json:"lat" example:"37.983810"`
	// Current status of the charging point
	Status string `json:"status" example:"available"`
	// Maximum charging capacity in kW
	Cap int `json:"cap" example:"22"`
}

// GetPoints godoc
// @Summary Get all charging points
// @Description Retrieves a list of all charging points with optional filtering by status and geographic bounds.
// @Description Results can be returned in JSON or CSV format.
// @Tags Points
// @Accept json
// @Produce json,text/csv
// @Param status query string false "Filter by status (available, occupied, reserved, faulted, offline)"
// @Param format query string false "Response format (json or csv)" default(json)
// @Param min_lat query number false "Minimum latitude for geographic filtering"
// @Param max_lat query number false "Maximum latitude for geographic filtering"
// @Param min_lon query number false "Minimum longitude for geographic filtering"
// @Param max_lon query number false "Maximum longitude for geographic filtering"
// @Success 200 {array} PointVague "Successfully retrieved list of charging points"
// @Success 204 "No Content - No charging points found matching the criteria"
// @Failure 401 {object} ErrorLogResponse "Invalid Status - Unrecognized status value"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error"
// @Router /getpoints [get]
func GetPoints(c *gin.Context) {
	// 1. Gin Helper: Τραβάει το query param ?status=... πολύ εύκολα
	// Αν δεν υπάρχει, επιστρέφει κενό string ""
	requestedStatus := c.Query("status")
	format := c.DefaultQuery("format", "json")

	// Γεωγραφικά όρια (Strings)
	minLatStr := c.Query("min_lat")
	maxLatStr := c.Query("max_lat")
	minLonStr := c.Query("min_lon")
	maxLonStr := c.Query("max_lon")

	db := repository.DB
	var locations []models.Location
	const providerName = "EMPower"

	if requestedStatus != "" && !isValidStatus(requestedStatus) {
		sendError(c, 401, "Invalid Status", fmt.Sprintf("Status '%s' is not recognized", requestedStatus))
		return
	}

	// 2. Χτίσιμο του Query Δυναμικά
	// Ξεκινάμε το query chain. Δεν βάζουμε .Find() ακόμα!
	query := db.Preload("Stations.Chargers")

	// Ελέγχουμε και προσθέτουμε φίλτρα αν δόθηκαν παράμετροι
	if val, err := strconv.ParseFloat(minLatStr, 64); err == nil {
		query = query.Where("latitude >= ?", val)
	}
	if val, err := strconv.ParseFloat(maxLatStr, 64); err == nil {
		query = query.Where("latitude <= ?", val)
	}
	if val, err := strconv.ParseFloat(minLonStr, 64); err == nil {
		query = query.Where("longitude >= ?", val)
	}
	if val, err := strconv.ParseFloat(maxLonStr, 64); err == nil {
		query = query.Where("longitude <= ?", val)
	}

	// 3. Εκτέλεση του Query
	// Τώρα καλείται η βάση με όλα τα WHERE που μαζέψαμε
	if err := query.Find(&locations).Error; err != nil {
		sendError(c, 500, "Database Error", err.Error())
		return
	}

	responseList := make([]PointVague, 0)

	for _, location := range locations {
		for _, s := range location.Stations {
			for _, charger := range s.Chargers {
				matchStatus := requestedStatus == "" ||
					strings.EqualFold(string(charger.Status), requestedStatus)
				if matchStatus {
					dto := PointVague{
						ProviderName: providerName,
						PointID:      fmt.Sprintf("%d", charger.ID),
						Long:         fmt.Sprintf("%f", location.Longitude),
						Lat:          fmt.Sprintf("%f", location.Latitude),
						Status:       string(charger.Status),
						Cap:          int(charger.MaxPowerKw),
					}
					responseList = append(responseList, dto)
				}
			}
		}
	}

	// Check if no points were found
	if len(responseList) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	// 4. Αποστολή απάντησης με Gin
	if strings.ToLower(format) == "csv" {
		// Return CSV format
		var buf bytes.Buffer
		writer := csv.NewWriter(&buf)

		// Write CSV header
		writer.Write([]string{"providerName", "pointid", "lon", "lat", "status", "cap"})

		// Write data rows
		for _, p := range responseList {
			writer.Write([]string{
				p.ProviderName,
				p.PointID,
				p.Long,
				p.Lat,
				p.Status,
				strconv.Itoa(p.Cap),
			})
		}
		writer.Flush()

		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=points.csv")
		c.String(http.StatusOK, buf.String())
	} else {
		// Return JSON format (default)
		// Το Gin βάζει αυτόματα Content-Type: application/json
		c.JSON(http.StatusOK, responseList)
	}
}

func isValidStatus(s string) bool {
	s = strings.ToLower(s)
	switch s {
	case "available", "occupied", "reserved", "faulted", "offline":
		return true
	default:
		return false
	}
}

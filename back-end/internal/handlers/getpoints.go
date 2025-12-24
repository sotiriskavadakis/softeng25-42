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

type PointVague struct {
	ProviderName string `json:"providerΝame"`
	PointID      string `json:"pointid"`
	Long         string `json:"lon"`
	Lat          string `json:"lat"`
	Status       string `json:"status"`
	Cap          int    `json:"cap"`
}

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

package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Χρησιμοποιούμε το ίδιο struct με το GetPoints για συνέπεια
// (Αν χρειάζεσαι περισσότερα πεδία για το single point, φτιάξε ένα PointDetailDTO)
type PointDetailDTO struct {
	PointID      string `json:"pointid"`
	Lon          string `json:"lon"`
	Lat          string `json:"lat"`
	Status       string `json:"status"`
	Cap          int    `json:"cap"`
	ReservationTime string `json:"reservation_time,omitempty"`
	KwhPrice	   string `json:"kwh_price,omitempty"`
	// Πρόσθεσε εδώ extra πεδία αν τα ζητάει η εκφώνηση για το single point
	// π.χ. Address string `json:"address"`
}

func GetPointByID(c *gin.Context) {
	// 1. Λήψη του ID από το URL (το :id που θα δηλώσουμε στο main)
	pointID := c.Param("id")

	db := repository.DB
	var charger models.Charger
	const providerName = "EMPower"

	// 2. Αναζήτηση στη βάση
	// Χρησιμοποιούμε First (όχι Find) γιατί ψάχνουμε ΕΝΑ συγκεκριμένο.
	// Κάνουμε Preload το Station.Location για να πάρουμε συντεταγμένες.
	err := db.Preload("Station.Location").First(&charger, "id = ?", pointID).Error

	if err != nil {
		// 3. Διαχείριση Λαθών
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Αν δεν βρεθεί το ID -> 404 Not Found (πολύ σημαντικό για GET /id)
			sendError(c, 404, "Not Found", fmt.Sprintf("Point with ID %s not found", pointID))
		} else {
			// Τεχνικό λάθος -> 500
			sendError(c, 500, "Database Error", err.Error())
		}
		return
	}

	// 4. Mapping (Database -> JSON DTO)
	lat := 0.0
	lon := 0.0
	if charger.StationID != 0 && charger.Station.Location.ID != 0 {
		lat = charger.Station.Location.Latitude
		lon = charger.Station.Location.Longitude
	}

	response := PointDetailDTO{
		ProviderName: providerName,
		PointID:      fmt.Sprintf("%d", charger.ID),
		Lon:          fmt.Sprintf("%f", lon),
		Lat:          fmt.Sprintf("%f", lat),
		Status:       string(charger.Status),
		Cap:          int(charger.MaxPowerKw),
	}

	// 5. Return JSON
	c.JSON(http.StatusOK, response)
}
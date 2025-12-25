package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/lib/pq"
	"gorm.io/gorm/clause"
)

// AddPointsResponse represents the response after importing charging points
// @Description Response body containing import status and row count
type AddPointsResponse struct {
	// Status of the import operation
	Status string `json:"status" example:"OK"`
	// Number of rows successfully imported
	ImportedRows int `json:"imported_rows" example:"150"`
}

// AddPoints godoc
// @Summary Import charging points from CSV
// @Description Imports charging points data from a CSV file. The CSV must contain columns for location,
// @Description station, and charger information. Existing records are updated (upsert behavior).
// @Description
// @Description Required CSV columns:
// @Description - loc_id: Location ID (required)
// @Description - loc_name: Location name
// @Description - address: Location address
// @Description - lat: Latitude coordinate
// @Description - long: Longitude coordinate
// @Description - is_fast: Whether location has fast chargers (boolean)
// @Description - charger_types: Comma-separated list of charger types
// @Description - station_id: Station ID
// @Description - network_id: Network ID
// @Description - charger_id: Charger ID
// @Description - type_id: Charger type ID
// @Description - status: Charger status
// @Description - power: Maximum power in kW
// @Tags Admin
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "CSV file containing charging points data"
// @Success 200 {object} AddPointsResponse "Successfully imported charging points"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Missing file parameter or invalid CSV format"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Upload error, CSV parsing error, or database error"
// @Router /addpoints [post]
func AddPoints(w http.ResponseWriter, r *http.Request) {
	// 1. Setup (Multipart form parsing...)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		sendErrorHTTP(w, r, 500, "Upload Error", "Could not parse form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		sendErrorHTTP(w, r, 400, "Bad Request", "Missing 'file' parameter")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)

	// 2. Διάβασε την ΠΡΩΤΗ γραμμή (Header)
	header, err := reader.Read()
	if err != nil {
		sendErrorHTTP(w, r, 400, "CSV Error", "Could not read header row")
		return
	}

	// 3. Δημιουργία Map: Όνομα Στήλης -> Index (π.χ. "loc_id" -> 0)
	headerMap := make(map[string]int)
	for i, colName := range header {
		headerMap[colName] = i
	}

	// Helper Closure: Μας φέρνει την τιμή βάσει ονόματος στήλης
	// Αν δεν υπάρχει η στήλη, επιστρέφει κενό string (ή θα μπορούσε να επιστρέφει error)
	getVal := func(row []string, colName string) string {
		idx, ok := headerMap[colName]
		if !ok || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}

	// 4. Start Transaction
	tx := repository.DB.Begin()
	lineCount := 0

	// 5. Read each subsequent row one by one
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "CSV Parsing Error", err.Error())
			return
		}
		lineCount++

		// --- A. Location ---
		locID := parseUint(getVal(record, "loc_id"))

		if locID == 0 {
			log.Printf("Skipping line %d: Missing loc_id", lineCount)
			continue
		}

		location := models.Location{
			ID:            locID,
			Name:          getVal(record, "loc_name"),
			Address:       getVal(record, "address"),
			Latitude:      parseFloat(getVal(record, "lat")),
			Longitude:     parseFloat(getVal(record, "long")),
			IsFastCharger: parseBool(getVal(record, "is_fast")),
			IsActive:      true,
			ChargerTypes:  pq.StringArray(strings.Split(getVal(record, "charger_types"), ",")),
		}

		// Εισαγωγή με Upsert (Update if exists, Insert otherwise)
		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&location).Error; err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "DB Error", fmt.Sprintf("Line %d (Location): %v", lineCount, err))
			return
		}

		// --- B. Station ---
		stationID := parseUint(getVal(record, "station_id"))
		station := models.Station{
			ID:         stationID,
			LocationID: location.ID,
			NetworkID:  parseInt(getVal(record, "network_id")),
		}

		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&station).Error; err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "DB Error", fmt.Sprintf("Line %d (Station): %v", lineCount, err))
			return
		}

		// --- C. Charger ---
		chargerID := parseUint(getVal(record, "charger_id"))
		connType := parseUint(getVal(record, "type_id"))

		// Pre-seed Type
		cType := models.ChargerType{ID: connType, Name: fmt.Sprintf("Type-%d", connType)}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&cType).Error; err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "DB Error", "Failed ChargerType")
			return
		}

		charger := models.Charger{
			ID:         chargerID,
			StationID:  station.ID,
			TypeID:     connType,
			Status:     models.ChargerStatus(getVal(record, "status")),
			MaxPowerKw: parseFloat(getVal(record, "power")),
		}

		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&charger).Error; err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "DB Error", fmt.Sprintf("Line %d (Charger): %v", lineCount, err))
			return
		}
	}

	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"OK", "imported_rows": %d}`, lineCount)
}

// ---------------------------------------------------------
// Helper Functions για να μη γεμίζει ο κώδικας με Atoi/ParseFloat
// ---------------------------------------------------------

func parseUint(s string) uint {
	val, _ := strconv.ParseUint(strings.TrimSpace(s), 10, 64)
	return uint(val)
}

func parseInt(s string) int {
	val, _ := strconv.Atoi(strings.TrimSpace(s))
	return val
}

func parseFloat(s string) float64 {
	val, _ := strconv.ParseFloat(strings.TrimSpace(s), 64)
	return val
}

func parseBool(s string) bool {
	val, _ := strconv.ParseBool(strings.TrimSpace(s))
	return val
}

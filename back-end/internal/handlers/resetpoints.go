package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/lib/pq"
	"gorm.io/gorm/clause"
)

// ResetPointsResponse represents the response after resetting charging points
// @Description Response confirming successful reset of charging points data
type ResetPointsResponse struct {
	// Status of the reset operation
	Status string `json:"status" example:"OK"`
}

// JsonOutlet represents an outlet/charger in the seed JSON file
// @Description Internal structure for parsing charger data from JSON seed file
type JsonOutlet struct {
	// Unique identifier for the outlet
	Id uint `json:"id"`
	// Connector type ID
	Connector uint `json:"connector"`
	// Maximum power output in kW (nullable)
	Kilowatts *float64 `json:"kilowatts"`
	// Current status (nullable)
	Status *string `json:"status"`
}

// JsonStation represents a station in the seed JSON file
// @Description Internal structure for parsing station data from JSON seed file
type JsonStation struct {
	// Unique identifier for the station
	Id uint `json:"id"`
	// Network identifier
	NetworkId int `json:"network_id"`
	// List of outlets/chargers at this station
	Outlets []JsonOutlet `json:"outlets"`
}

// JsonLocation represents a location in the seed JSON file
// @Description Internal structure for parsing location data from JSON seed file
type JsonLocation struct {
	// Unique identifier for the location
	Id uint `json:"id"`
	// Location name
	Name string `json:"name"`
	// Physical address
	Address string `json:"address"`
	// GPS latitude coordinate
	Latitude float64 `json:"latitude"`
	// GPS longitude coordinate
	Longitude float64 `json:"longitude"`
	// Whether location has fast chargers
	IsFastCharger bool `json:"is_fast_charger"`
	// Whether location is under repair
	UnderRepair bool `json:"under_repair"`
	// Whether location is coming soon
	ComingSoon bool `json:"coming_soon"`
	// Access type identifier
	Access int `json:"access"`
	// Location score/rating
	Score float64 `json:"score"`
	// Icon identifier
	Icon string `json:"icon"`
	// Icon type
	IconType string `json:"icon_type"`
	// URL to map card logo
	MapCardLogoUrl string `json:"map_card_logo_url"`
	// URL to location page
	Url string `json:"url"`
	// Total number of stations
	StationCount int `json:"station_count"`
	// Number of available stations (nullable)
	AvailableStationCount *int `json:"available_station_count"`
	// Number of stations in use (nullable)
	InUseStationCount *int `json:"in_use_station_count"`
	// List of connector types available
	ConnectorTypes []string `json:"connector_types"`
	// List of stations at this location
	Stations []JsonStation `json:"stations"`
}

// ResetPoints godoc
// @Summary Reset all charging points to initial state
// @Description Performs a complete reset of the charging points database by:
// @Description 1. Deleting all existing charging sessions, reservations, chargers, stations, and locations
// @Description 2. Re-importing all data from the seed JSON file (data/parts1234.json)
// @Description
// @Description This operation is atomic - if any step fails, all changes are rolled back.
// @Description Use with caution as this will delete all existing session and reservation data.
// @Tags Admin
// @Accept json
// @Produce json
// @Success 200 {object} ResetPointsResponse "Successfully reset all charging points"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - File read error, JSON parsing error, or database error"
// @Router /resetpoints [post]
func ResetPoints(w http.ResponseWriter, r *http.Request) {
	// 1. Hardwired Path για το JSON αρχείο
	const jsonFilePath = "data/parts1234.json"

	// 2. Άνοιγμα και Διάβασμα Αρχείου
	fileData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		sendErrorHTTP(w, r, 500, "File Error", "Could not read json file")
		return
	}

	// 3. Parsing του JSON (Η λογική από τον Seeder σου)
	var jsonLocations []JsonLocation // Χρησιμοποιούμε τα structs που όρισες στον seeder
	if err := json.Unmarshal(fileData, &jsonLocations); err != nil {
		sendErrorHTTP(w, r, 500, "JSON Error", "Invalid JSON format: "+err.Error())
		return
	}

	// 4. Ξεκινάμε Transaction (Πολύ σημαντικό για το Reset)
	// Αν κάτι πάει στραβά στη μέση, δεν θα μείνει η βάση μισο-άδεια.
	tx := repository.DB.Begin()

	// ---------------------------------------------------------
	// ΒΗΜΑ Α: WIPE (Διαγραφή παλιών δεδομένων)
	// ---------------------------------------------------------

	// Πρώτα διαγράφουμε όλα τα δεδομένα για τις συνεδρίες γιατί
	// αλλιώς παραβιάζονται τα foreign key constraints.
	if err := tx.Exec("DELETE FROM charging_sessions").Error; err != nil {
		tx.Rollback()
		sendErrorHTTP(w, r, 500, "DB Error", "Failed to clear Sessions")
		return
	}
	if err := tx.Exec("DELETE FROM reservations").Error; err != nil {
		tx.Rollback()
		sendErrorHTTP(w, r, 500, "DB Error", "Failed to clear Reservations")
		return
	}
	// Σβήνουμε με αντίστροφη σειρά (Παιδί -> Γονιός)
	if err := tx.Exec("DELETE FROM chargers").Error; err != nil {
		tx.Rollback()
		sendErrorHTTP(w, r, 500, "DB Error", "Failed to clear Chargers")
		return
	}
	if err := tx.Exec("DELETE FROM stations").Error; err != nil {
		tx.Rollback()
		sendErrorHTTP(w, r, 500, "DB Error", "Failed to clear Stations")
		return
	}
	if err := tx.Exec("DELETE FROM locations").Error; err != nil {
		tx.Rollback()
		sendErrorHTTP(w, r, 500, "DB Error", "Failed to clear Locations")
		return
	}

	// ---------------------------------------------------------
	// ΒΗΜΑ Β: SEED (Η λογική εισαγωγής δεδομένων από τον seeder)
	// ---------------------------------------------------------

	// Seed all ChargerTypes first (to avoid FK constraint issues)
	seenTypes := make(map[uint]bool)
	for _, locData := range jsonLocations {
		for _, stationData := range locData.Stations {
			for _, outletData := range stationData.Outlets {

				// Αν δεν το έχουμε ξαναδεί σε αυτό το loop
				if !seenTypes[outletData.Connector] {
					seenTypes[outletData.Connector] = true

					var name string
					switch outletData.Connector {
					case 2:
						name = "J-1772"
					case 3:
						name = "CHAdeMO"
					case 7:
						name = "Type 2"
					case 8:
						name = "Type 3"
					case 10:
						name = "Wall (Euro)"
					case 13:
						name = "CCS1"
					case 14:
						name = "Caravan Mains Socket"
					case 15:
						name = "Three Phase EU"
					case 20:
						name = "CCS2"
					case 24:
						name = "Type 3A"
					}

					cType := models.ChargerType{
						ID:   outletData.Connector,
						Name: name,
					}

					// Προσπάθεια εισαγωγής με το Transaction (tx)
					// Το 'DoNothing' σημαίνει: Αν υπάρχει ήδη το ID, μην κάνεις error, απλά προχώρα.
					if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&cType).Error; err != nil {
						tx.Rollback() // ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: Ακύρωση όσων διαγραφών κάναμε πιο πριν
						sendErrorHTTP(w, r, 500, "Database Error", "Failed to seed ChargerTypes: "+err.Error())
						return
					}
				}
			}
		}
	}

	for _, locData := range jsonLocations {
		// Μετατροπή JsonLocation -> models.Location (Ο κώδικάς σου)
		location := models.Location{
			ID:                    locData.Id,
			Name:                  locData.Name,
			Address:               locData.Address,
			Latitude:              locData.Latitude,
			Longitude:             locData.Longitude,
			IsActive:              true,
			IsFastCharger:         locData.IsFastCharger,
			UnderRepair:           locData.UnderRepair,
			ComingSoon:            locData.ComingSoon,
			Access:                locData.Access,
			Score:                 locData.Score,
			Icon:                  locData.Icon,
			IconType:              locData.IconType,
			MapCardLogoUrl:        locData.MapCardLogoUrl,
			Url:                   locData.Url,
			StationCount:          locData.StationCount,
			AvailableStationCount: &locData.StationCount,
			InUseStationCount:     new(int),
			ChargerTypes:          pq.StringArray(locData.ConnectorTypes),
		}

		// Χρησιμοποιούμε το 'tx' αντί για 'db' εδώ!
		if err := tx.Create(&location).Error; err != nil {
			tx.Rollback()
			sendErrorHTTP(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed location %d: %v", location.ID, err))
			return
		}

		// Stations Loop
		for _, stationData := range locData.Stations {
			station := models.Station{
				ID:         stationData.Id,
				LocationID: location.ID,
				NetworkID:  stationData.NetworkId,
			}

			if err := tx.Create(&station).Error; err != nil {
				tx.Rollback()
				sendErrorHTTP(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed station %d", station.ID))
				return
			}

			// Chargers Loop
			for _, outletData := range stationData.Outlets {

				// 1. Handle Power (default to 22 if null)
				var power float64 = 22
				if outletData.Kilowatts != nil {
					power = *outletData.Kilowatts
				}

				// 2. Handle Status (default to available if null)
				var status models.ChargerStatus = models.StatusAvailable
				if outletData.Status != nil && *outletData.Status != "" {
					switch *outletData.Status {
					case "AVAILABLE":
						status = models.StatusAvailable
					case "CHARGING":
						status = models.StatusCharging
					case "UNDER_REPAIR":
						status = models.StatusMalfunction
					case "UNKNOWN", "OUTOFORDER":
						status = models.StatusOffline
					default:
						status = models.StatusAvailable
					}
				}

				// 3. Create Charger (ChargerType already seeded in step 4)
				charger := models.Charger{
					ID:         outletData.Id,
					StationID:  station.ID,
					TypeID:     outletData.Connector,
					Status:     status,
					MaxPowerKw: power,
				}

				if err := tx.Create(&charger).Error; err != nil {
					tx.Rollback()
					sendErrorHTTP(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed charger %d", charger.ID))
					return
				}
			}
		}
	}

	// 5. Commit
	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "OK"})
}

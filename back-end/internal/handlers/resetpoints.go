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

// This api handler follows the logic of the seeder to reset the points in the database

// --- JSON Structs for parsing (copied from seeder) ---
type JsonOutlet struct {
	Id        uint     `json:"id"`
	Connector uint     `json:"connector"`
	Kilowatts *float64 `json:"kilowatts"`
	Status    *string  `json:"status"`
}

type JsonStation struct {
	Id        uint         `json:"id"`
	NetworkId int          `json:"network_id"`
	Outlets   []JsonOutlet `json:"outlets"`
}

type JsonLocation struct {
	Id                    uint          `json:"id"`
	Name                  string        `json:"name"`
	Address               string        `json:"address"`
	Latitude              float64       `json:"latitude"`
	Longitude             float64       `json:"longitude"`
	IsFastCharger         bool          `json:"is_fast_charger"`
	UnderRepair           bool          `json:"under_repair"`
	ComingSoon            bool          `json:"coming_soon"`
	Access                int           `json:"access"`
	Score                 float64       `json:"score"`
	Icon                  string        `json:"icon"`
	IconType              string        `json:"icon_type"`
	MapCardLogoUrl        string        `json:"map_card_logo_url"`
	Url                   string        `json:"url"`
	StationCount          int           `json:"station_count"`
	AvailableStationCount *int          `json:"available_station_count"`
	InUseStationCount     *int          `json:"in_use_station_count"`
	ConnectorTypes        []string      `json:"connector_types"`
	Stations              []JsonStation `json:"stations"`
}

func ResetPoints(w http.ResponseWriter, r *http.Request) {
	// 1. Hardwired Path για το JSON αρχείο
	const jsonFilePath = "data/parts1234.json"

	// 2. Άνοιγμα και Διάβασμα Αρχείου
	fileData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		sendError(w, r, 500, "File Error", "Could not read json file")
		return
	}

	// 3. Parsing του JSON (Η λογική από τον Seeder σου)
	var jsonLocations []JsonLocation // Χρησιμοποιούμε τα structs που όρισες στον seeder
	if err := json.Unmarshal(fileData, &jsonLocations); err != nil {
		sendError(w, r, 500, "JSON Error", "Invalid JSON format: "+err.Error())
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
		sendError(w, r, 500, "DB Error", "Failed to clear Sessions")
		return
	}
	if err := tx.Exec("DELETE FROM reservations").Error; err != nil {
		tx.Rollback()
		sendError(w, r, 500, "DB Error", "Failed to clear Reservations")
		return
	}
	// Σβήνουμε με αντίστροφη σειρά (Παιδί -> Γονιός)
	if err := tx.Exec("DELETE FROM chargers").Error; err != nil {
		tx.Rollback()
		sendError(w, r, 500, "DB Error", "Failed to clear Chargers")
		return
	}
	if err := tx.Exec("DELETE FROM stations").Error; err != nil {
		tx.Rollback()
		sendError(w, r, 500, "DB Error", "Failed to clear Stations")
		return
	}
	if err := tx.Exec("DELETE FROM locations").Error; err != nil {
		tx.Rollback()
		sendError(w, r, 500, "DB Error", "Failed to clear Locations")
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

					cType := models.ChargerType{
						ID:   outletData.Connector,
						Name: fmt.Sprintf("Type-%d", outletData.Connector),
					}

					// Προσπάθεια εισαγωγής με το Transaction (tx)
					// Το 'DoNothing' σημαίνει: Αν υπάρχει ήδη το ID, μην κάνεις error, απλά προχώρα.
					if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&cType).Error; err != nil {
						tx.Rollback() // ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: Ακύρωση όσων διαγραφών κάναμε πιο πριν
						sendError(w, r, 500, "Database Error", "Failed to seed ChargerTypes: "+err.Error())
						return
					}
				}
			}
		}
	}

	for _, locData := range jsonLocations {
		// Μετατροπή JsonLocation -> models.Location (Ο κώδικάς σου)
		location := models.Location{
			ID:            locData.Id,
			Name:          locData.Name,
			Address:       locData.Address,
			Latitude:      locData.Latitude,
			Longitude:     locData.Longitude,
			IsFastCharger: locData.IsFastCharger,
			// ... υπόλοιπα πεδία ...
			ChargerTypes: pq.StringArray(locData.ConnectorTypes),
		}

		// Χρησιμοποιούμε το 'tx' αντί για 'db' εδώ!
		if err := tx.Create(&location).Error; err != nil {
			tx.Rollback()
			sendError(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed location %d: %v", location.ID, err))
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
				sendError(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed station %d", station.ID))
				return
			}

			// Chargers Loop
			for _, outletData := range stationData.Outlets {

				// 1. Handle Power (default to 22 if null)
				var power float64 = 22
				if outletData.Kilowatts != nil {
					power = *outletData.Kilowatts
				}

				// 2. Handle Status (default to AVAILABLE if null)
				var status models.ChargerStatus = models.StatusAvailable
				if outletData.Status != nil && *outletData.Status != "" {
					switch *outletData.Status {
					case "AVAILABLE":
						status = models.StatusAvailable
					case "CHARGING":
						status = models.StatusOccupied
					case "UNDER_REPAIR":
						status = models.StatusFaulted
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
					sendError(w, r, 500, "DB Insert Error", fmt.Sprintf("Failed charger %d", charger.ID))
					return
				}
			}
		}
	}

	// 5. Commit και Επιτυχία
	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "OK"})
}

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"

	"github.com/lib/pq"
	"gorm.io/gorm/clause"
)

// --- JSON Structs for parsing ---
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

func main() {
	// 1. Initialize Database Connection
	repository.Connect()
	db := repository.DB

	// 2. Open the JSON file
	jsonFile, err := os.Open("back-end/data/parts1234.json")
	if err != nil {
		log.Fatalf("Error opening JSON file: %v", err)
	}
	defer jsonFile.Close()

	// 3. Read and Parse
	byteValue, _ := io.ReadAll(jsonFile)
	var jsonLocations []JsonLocation
	if err := json.Unmarshal(byteValue, &jsonLocations); err != nil {
		log.Fatalf("Error parsing JSON: %v", err)
	}

	fmt.Printf(" seeding %d locations...\n", len(jsonLocations))

	// 4. Pre-seed all ChargerTypes first (to avoid FK constraint issues)
	seenTypes := make(map[uint]bool)
	for _, locData := range jsonLocations {
		for _, stationData := range locData.Stations {
			for _, outletData := range stationData.Outlets {
				if !seenTypes[outletData.Connector] {
					seenTypes[outletData.Connector] = true
					cType := models.ChargerType{
						ID:   outletData.Connector,
						Name: fmt.Sprintf("Type-%d", outletData.Connector),
					}
					if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&cType).Error; err != nil {
						log.Printf("Note: ChargerType %d may already exist or failed: %v", cType.ID, err)
					}
				}
			}
		}
	}
	fmt.Printf("✅ Pre-seeded %d charger types\n", len(seenTypes))

	// 5. Iterate and Insert Locations, Stations, and Chargers
	for _, locData := range jsonLocations {

		// --- A. Create Location ---
		// Note: CountyName is omitted here, so it defaults to nil (NULL in DB)
		location := models.Location{
			ID:                    locData.Id,
			Name:                  locData.Name,
			Address:               locData.Address,
			Latitude:              locData.Latitude,
			Longitude:             locData.Longitude,
			IsActive:              true, // Defaulting to true as it wasn't in JSON
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
			InUseStationCount:     new(int), // defaults to 0
			ChargerTypes:          pq.StringArray(locData.ConnectorTypes),
		}

		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&location).Error; err != nil {
			log.Printf("Failed to seed Location %d: %v", location.ID, err)
			continue
		}

		// --- B. Create Stations ---
		for _, stationData := range locData.Stations {
			station := models.Station{
				ID:         stationData.Id,
				LocationID: location.ID,
				NetworkID:  stationData.NetworkId,
			}

			if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&station).Error; err != nil {
				log.Printf("Failed to seed Station %d: %v", station.ID, err)
				continue
			}

			// --- C. Create Chargers (Outlets) ---
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

				if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&charger).Error; err != nil {
					log.Printf("Failed to seed Charger %d: %v", charger.ID, err)
				}
			}
		}
	}

	fmt.Println("✅ Database seeded successfully!")
}

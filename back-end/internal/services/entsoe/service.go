package entsoe

import (
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"softeng25-42/back-end/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	SecurityToken  = "a92129f3-f7f3-4240-a154-aac98a569422"
	BaseURL        = "https://web-api.tp.entsoe.eu/api"
	AreaCodePrices = "10YGR-HTSO-----Y" // Greece (GR)
	DocTypePrices  = "A44"
)

// Simplified XML structs for Prices only
type Publication_MarketDocument struct {
	XMLName    xml.Name     `xml:"Publication_MarketDocument"`
	TimeSeries []TimeSeries `xml:"TimeSeries"`
}
type TimeSeries struct {
	Period []Period `xml:"Period"`
}
type Period struct {
	TimeInterval TimeInterval `xml:"timeInterval"`
	Resolution   string       `xml:"resolution"`
	Points       []Point      `xml:"Point"`
}
type TimeInterval struct {
	Start string `xml:"start"`
}
type Point struct {
	Position    int     `xml:"position"`
	PriceAmount float64 `xml:"price.amount"`
}

// StartService initializes the background tasks
func StartService(db *gorm.DB) {
	go func() {
		// Initial sync
		sync(db)

		// Sync once per day
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			sync(db)
		}
	}()
}

func sync(db *gorm.DB) {
	now := time.Now().UTC()

	// 1. Fetch Tomorrow's prices (if it's a new day or missing)
	// Simple strategy: Always try to fetch today and tomorrow. API is fast enough.
	// This covers "midnight update" and "system restart".
	fetchPrices(db, now)
	fetchPrices(db, now.Add(24*time.Hour))

	// 2. Update Charger Prices for CURRENT hour
	updateChargers(db)
}

func fetchPrices(db *gorm.DB, targetDate time.Time) {
	start := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	url := fmt.Sprintf("%s?securityToken=%s&documentType=%s&in_Domain=%s&out_Domain=%s&periodStart=%s&periodEnd=%s",
		BaseURL, SecurityToken, DocTypePrices, AreaCodePrices, AreaCodePrices,
		start.Format("200601021504"), end.Format("200601021504"))

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("ENTSO-E Fetch failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return // Silent fail or log if strictly needed
	}

	body, _ := ioutil.ReadAll(resp.Body)
	var doc Publication_MarketDocument
	if err := xml.Unmarshal(body, &doc); err != nil {
		return
	}

	var prices []models.ElectricityPrice
	for _, ts := range doc.TimeSeries {
		for _, p := range ts.Period {
			baseTime, _ := time.Parse("2006-01-02T15:04Z", p.TimeInterval.Start)
			// Assuming PT60M for simplicity as per requirements (hourly)
			// If resolution varies, add logic back. But usually it's hourly for day-ahead.

			for _, pt := range p.Points {
				t := baseTime.Add(time.Duration(pt.Position-1) * time.Hour)
				prices = append(prices, models.ElectricityPrice{
					Timestamp:  t,
					Price:      pt.PriceAmount,
					AreaCode:   AreaCodePrices,
					Resolution: "PT60M",
				})
			}
		}
	}

	if len(prices) > 0 {
		db.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(prices, 100)
		log.Printf("Synced %d prices for %s", len(prices), targetDate.Format("2006-01-02"))
	}
}

func updateChargers(db *gorm.DB) {
	now := time.Now().UTC()
	currentHour := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 0, 0, 0, time.UTC)

	var price models.ElectricityPrice
	if err := db.Where("timestamp = ? AND area_code = ?", currentHour, AreaCodePrices).First(&price).Error; err != nil {
		// No price found for this hour (maybe API failed), do nothing.
		return
	}

	// Convert EUR/MWh -> EUR/kWh
	kwhPrice := price.Price / 1000.0

	db.Model(&models.Charger{}).
		Where("is_manual_price = ?", false).
		Update("kwh_price", kwhPrice)

	log.Printf("Chargers updated to %.4f EUR/kWh", kwhPrice)
}

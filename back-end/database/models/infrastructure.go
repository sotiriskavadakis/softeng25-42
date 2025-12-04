package models

import (
	"github.com/lib/pq" // Required for Postgres Arrays
)

type Region struct {
	Name     string   `gorm:"primaryKey" json:"name"`
	Counties []County `gorm:"foreignKey:RegionName" json:"counties,omitempty"`
}

type County struct {
	Name       string   `gorm:"primaryKey" json:"name"`
	RegionName string   `json:"region_name"`
	Region     Region   `gorm:"foreignKey:RegionName" json:"-"` // Hide from JSON to prevent loops
	Locations  []Location `gorm:"foreignKey:CountyName" json:"locations,omitempty"`
}

type Location struct {
	// We map the Go field "ID" to the DB column "location_id"
	ID uint `gorm:"primaryKey;column:location_id" json:"id"`

	CountyName string `json:"county_name"`
	County     County `gorm:"foreignKey:CountyName" json:"-"`

	Name    string  `json:"name"`
	Address string  `json:"address"`
	
	// Spatial Data
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	// Status & Metadata
	IsActive     bool    `json:"is_active"`
	IsFastCharger bool   `json:"is_fast_charger"`
	UnderRepair  bool    `json:"under_repair"`
	ComingSoon   bool    `json:"coming_soon"`
	// Access maybe not needed
	Access       int     `json:"access"`
	// Score is a metric to indicate kWh price
	Score        float64 `json:"score"`
	Icon         string  `json:"icon"`
	IconType     string  `json:"icon_type"`
	MapCardLogoUrl  string  `gorm:"column:map_card_logo_url" json:"map_card_logo_url"`
	Url          string  `json:"url"`

	// Stats (Pointers allow null values in JSON/DB)
	StationCount          int  `json:"station_count"`
	AvailableStationCount *int `json:"available_station_count"` 
	InUseStationCount     *int `json:"in_use_station_count"`    

	// Postgres specific Array type
	ChargerTypes pq.StringArray `gorm:"type:text[]" json:"charger_types"`

	// Relationships
	Stations []Station `gorm:"foreignKey:LocationID" json:"stations,omitempty"`
}

type Station struct {
	ID         uint   `gorm:"primaryKey;column:station_id" json:"id"`
	LocationID uint   `json:"location_id"`
	PhysicalID string `json:"physical_id"`
	NetworkID  int    `json:"network_id"`
	
	Chargers []Charger `gorm:"foreignKey:StationID" json:"chargers,omitempty"`
}

type ChargerType struct {
	ID                uint    `gorm:"primaryKey;column:type_id" json:"id"`
	Name              string  `json:"name"`
	MaxSupportedPower float64 `json:"max_supported_power"`
	IconUrl           string  `json:"icon_url"`
}

type Charger struct {
	ID        uint        `gorm:"primaryKey;column:charger_id" json:"id"`
	StationID uint        `json:"station_id"`
	TypeID    uint        `json:"type_id"`
	Type      ChargerType `gorm:"foreignKey:TypeID" json:"type"`
	
	Status       ChargerStatus `gorm:"type:varchar(20)" json:"status"`
	MaxPowerKw   float64       `json:"max_power_kw"`
}
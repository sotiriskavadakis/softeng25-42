package models

import (
	"github.com/lib/pq"
)

type Region struct {
	Name string `gorm:"primaryKey" json:"name"`
	// Removed "Counties []County"
}

type County struct {
	Name string `gorm:"primaryKey" json:"name"`

	// Pointer to allow Null
	RegionName *string `json:"region_name"`

	// Belongs To Region (The Parent)
	Region Region `gorm:"foreignKey:RegionName;references:Name" json:"-"`

	// Removed "Locations []Location"
}

type Location struct {
	ID uint `gorm:"primaryKey;column:location_id" json:"id"`

	CountyName *string `json:"county_name"`

	// Belongs To County (The Parent)
	County County `gorm:"foreignKey:CountyName;references:Name" json:"-"`

	Name    string `json:"name"`
	Address string `json:"address"`

	// Spatial Data
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	// Metadata
	IsActive       bool    `json:"is_active"`
	IsFastCharger  bool    `json:"is_fast_charger"`
	UnderRepair    bool    `json:"under_repair"`
	ComingSoon     bool    `json:"coming_soon"`
	Access         int     `json:"access"`
	Score          float64 `json:"score"`
	Icon           string  `json:"icon"`
	IconType       string  `json:"icon_type"`
	MapCardLogoUrl string  `gorm:"column:map_card_logo_url" json:"map_card_logo_url"`
	Url            string  `json:"url"`

	// Stats
	StationCount          int  `json:"station_count"`
	AvailableStationCount *int `json:"available_station_count"`
	InUseStationCount     *int `json:"in_use_station_count"`

	ChargerTypes pq.StringArray `gorm:"type:text[]" json:"charger_types"`

	// Has Many Stations
	Stations []Station `gorm:"foreignKey:LocationID;references:ID"`
}

type Station struct {
	ID         uint `gorm:"primaryKey;column:station_id" json:"id"`
	LocationID uint `gorm:"column:location_id" json:"location_id"`

	// Belongs To Location (for reverse lookup) - constraint:- prevents duplicate FK
	Location Location `gorm:"foreignKey:LocationID;references:ID;constraint:-" json:"-"`

	PhysicalID string `json:"physical_id"`
	NetworkID  int    `json:"network_id"`

	// Has Many Chargers
	Chargers []Charger `gorm:"foreignKey:StationID;references:ID"`
}

type ChargerType struct {
	ID                uint    `gorm:"primaryKey;column:type_id" json:"id"`
	Name              string  `json:"name"`
	MaxSupportedPower float64 `json:"max_supported_power"`
	IconUrl           string  `json:"icon_url"`
}

type Charger struct {
	ID uint `gorm:"primaryKey;column:charger_id" json:"id"`

	StationID uint `gorm:"column:station_id" json:"station_id"`

	// Belongs To Station (for reverse lookup) - constraint:- prevents duplicate FK
	Station Station `gorm:"foreignKey:StationID;references:ID;constraint:-" json:"-"`

	TypeID uint `gorm:"column:type_id" json:"type_id"`

	Status ChargerStatus `gorm:"type:varchar(20);check:status IN ('available', 'charging', 'reserved', 'malfunction', 'offline')" json:"status"`

	MaxPowerKw float64 `json:"max_power_kw"`
	KwhPrice   float64 `gorm:"column:kwh_price;default:0.30" json:"kwhprice"`
}

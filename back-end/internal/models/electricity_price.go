package models

import (
	"time"
)

type ElectricityPrice struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Timestamp  time.Time `gorm:"index:idx_price_timestamp_area,unique;not null" json:"timestamp"`
	Price      float64   `gorm:"not null" json:"price"` // Currency/MWh or kWh
	Currency   string    `gorm:"type:varchar(10);default:'EUR'" json:"currency"`
	AreaCode   string    `gorm:"type:varchar(50);index:idx_price_timestamp_area,unique;not null" json:"area_code"`
	Resolution string    `gorm:"type:varchar(20)" json:"resolution"`
	CreatedAt  time.Time `json:"created_at"`
}

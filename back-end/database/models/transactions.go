package models

import (
	"time"
)

type Reservation struct {
	ID              uint      `gorm:"primaryKey;column:reservation_id" json:"id"`
	UserID          uint      `gorm:"column:usr_id" json:"user_id"`
	ChargerID       uint      `json:"charger_id"`
	StartTime       time.Time `json:"start_time"`
	DurationMinutes int       `json:"duration_minutes"`
}

type ChargingSession struct {
	ID        uint      `gorm:"primaryKey;column:session_id" json:"id"`
	UserID    uint      `gorm:"column:usr_id" json:"user_id"`
	ChargerID uint      `json:"charger_id"`
	CardID    uint      `json:"card_id"`
	
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	
	TotalKwh  float64   `json:"total_kwh"`
	TotalCost float64   `json:"total_cost"`
}
package models

import (
	"time"
)

type StatusChange struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ChargerID uint      `gorm:"index;not null" json:"charger_id"`
	OldStatus string    `gorm:"type:varchar(20)" json:"old_status"`
	NewStatus string    `gorm:"type:varchar(20)" json:"new_status"`
	ChangedAt time.Time `gorm:"index;not null" json:"changed_at"`
}

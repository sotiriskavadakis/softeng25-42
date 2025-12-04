package models

type ChargerStatus string

const (
	StatusAvailable ChargerStatus = "AVAILABLE"
	StatusOccupied  ChargerStatus = "OCCUPIED"
	StatusReserved  ChargerStatus = "RESERVED"
	StatusFaulted   ChargerStatus = "FAULTED"
	StatusOffline   ChargerStatus = "OFFLINE"
)
package models

type ChargerStatus string

const (
	StatusAvailable   ChargerStatus = "AVAILABLE"
	StatusCharging    ChargerStatus = "OCCUPIED"
	StatusReserved    ChargerStatus = "RESERVED"
	StatusMalfunction ChargerStatus = "FAULTED"
	StatusOffline     ChargerStatus = "OFFLINE"
)

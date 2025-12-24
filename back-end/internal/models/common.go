package models

type ChargerStatus string

const (
	StatusAvailable   ChargerStatus = "available"
	StatusCharging    ChargerStatus = "charging"
	StatusReserved    ChargerStatus = "reserved"
	StatusMalfunction ChargerStatus = "malfunction"
	StatusOffline     ChargerStatus = "offline"
)

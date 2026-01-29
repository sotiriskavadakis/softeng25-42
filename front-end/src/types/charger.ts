// Charger Status enum matching SRS
export type ChargerStatus = "available" | "occupied" | "reserved" | "faulted" | "offline";

// Geographic hierarchy matching SRS ER diagram
export interface Region {
  name: string;
  counties: County[];
}

export interface County {
  name: string;
  regionName: string;
}

// Location (parking lot / site)
export interface Location {
  locationId: string;
  countyName: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  score: number;
  stationCount: number;
  availableStationCount: number;
  inUseStationCount: number;
  chargerTypes: string[];
  thumbnailUrl?: string;
  comingSoon: boolean;
  underRepair: boolean;
}

// Station (physical EVSE box)
export interface Station {
  stationId: string;
  locationId: string;
  networkId: string;
  physicalId: string;
  chargers: Charger[];
}

// Charger Type (CCS2, Type 2, CHAdeMO, etc.)
export interface ChargerType {
  typeId: string;
  name: string;
  maxSupportedPower: number;
  iconUrl?: string;
}

// Charger (specific plug/outlet)
export interface Charger {
  chargerId: string;
  stationId: string;
  typeId: string;
  typeName: string; // Denormalized for display
  status: ChargerStatus;
  maxPowerKw: number;
  tariffPerKwh: number;
  // Denormalized location info for display
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  rating?: number;
  distance?: number;
}

// Charger filter options
export interface ChargerFilter {
  status?: ChargerStatus[];
  minPower?: number;
  maxPrice?: number;
  connectorType?: string;
  region?: string;
  county?: string;
}

// Status labels for display
export const CHARGER_STATUS_LABELS: Record<ChargerStatus, string> = {
  available: "Available",
  occupied: "In Use",
  reserved: "Reserved",
  faulted: "Faulted",
  offline: "Offline",
};

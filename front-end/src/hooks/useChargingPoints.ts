import { useQuery } from "@tanstack/react-query";
import { 
  fetchAllPoints, 
  fetchAvailablePoints, 
  fetchPointsInBounds,
  fetchAvailablePointsInBounds,
  ChargingPoint, 
  BoundingBox,
  PointStatus,
  ApiError 
} from "@/lib/api/points";
import { ChargerStatus } from "@/types";

// Re-export types
export type { ChargingPoint, BoundingBox, PointStatus };

export interface LocationWithChargers {
  locationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isFastCharger: boolean;
  underRepair: boolean;
  comingSoon: boolean;
  score: number;
  stationCount: number;
  availableStationCount: number | null;
  inUseStationCount: number | null;
  chargerTypes: string[];
  icon: string | null;
  iconType: string | null;
  mapCardLogoUrl: string | null;
  url: string | null;
  totalChargers: number;
  availableChargers: number;
  chargers: ChargerInfo[];
  status: PointStatus;
  providerName: string;
  capacity: number;
}

export interface ChargerInfo {
  chargerId: string;
  stationId: string;
  typeId: number;
  typeName: string;
  status: ChargerStatus;
  maxPowerKw: number;
}

/**
 * Group charging points by location (same lat/lon) and transform to LocationWithChargers
 */
function groupPointsByLocation(points: ChargingPoint[]): LocationWithChargers[] {
  // Group by coordinates (rounded to 6 decimal places to handle floating point)
  const locationMap = new Map<string, ChargingPoint[]>();

  for (const point of points) {
    const key = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
    const existing = locationMap.get(key) || [];
    existing.push(point);
    locationMap.set(key, existing);
  }

  // Transform each group into a LocationWithChargers
  return Array.from(locationMap.entries()).map(([key, groupedPoints]) => {
    const first = groupedPoints[0];
    const totalChargers = groupedPoints.length;
    const availableChargers = groupedPoints.filter(p => p.status === "AVAILABLE").length;
    const hasOffline = groupedPoints.some(p => p.status === "OFFLINE");

    // Generate charger info for each point in the group
    const chargers: ChargerInfo[] = groupedPoints.map((p, index) => ({
      chargerId: p.id,
      stationId: p.id,
      typeId: 1,
      typeName: `${p.capacity}kW`,
      status: (p.status === "AVAILABLE" ? "available" : 
               p.status === "OFFLINE" ? "faulted" : "occupied") as ChargerStatus,
      maxPowerKw: p.capacity,
    }));

    return {
      locationId: key, // Use coordinate key as unique ID
      name: first.providerName,
      address: `${first.latitude.toFixed(4)}, ${first.longitude.toFixed(4)}`,
      latitude: first.latitude,
      longitude: first.longitude,
      isActive: !hasOffline || availableChargers > 0,
      isFastCharger: groupedPoints.some(p => p.capacity > 22),
      underRepair: hasOffline && availableChargers === 0,
      comingSoon: false,
      score: 0,
      stationCount: totalChargers,
      availableStationCount: availableChargers,
      inUseStationCount: totalChargers - availableChargers,
      chargerTypes: [...new Set(groupedPoints.map(p => `${p.capacity}kW`))],
      icon: null,
      iconType: null,
      mapCardLogoUrl: null,
      url: null,
      totalChargers,
      availableChargers,
      chargers,
      status: availableChargers > 0 ? "AVAILABLE" : hasOffline ? "OFFLINE" : "BUSY",
      providerName: first.providerName,
      capacity: groupedPoints.reduce((sum, p) => sum + p.capacity, 0),
    };
  });
}

interface UseChargingPointsOptions {
  status?: PointStatus;
  bounds?: BoundingBox;
  enabled?: boolean;
}

/**
 * Hook to fetch charging points from the API
 * Supports filtering by status and bounding box
 */
export function useChargingPoints(options: UseChargingPointsOptions = {}) {
  const { status, bounds, enabled = true } = options;

  return useQuery({
    queryKey: ["charging-points", status, bounds],
    queryFn: async (): Promise<LocationWithChargers[]> => {
      let points: ChargingPoint[];

      if (bounds && status === "AVAILABLE") {
        points = await fetchAvailablePointsInBounds(bounds);
      } else if (bounds) {
        points = await fetchPointsInBounds(bounds);
      } else if (status === "AVAILABLE") {
        points = await fetchAvailablePoints();
      } else {
        points = await fetchAllPoints();
      }

      // Group points by location coordinates
      return groupPointsByLocation(points);
    },
    enabled,
    staleTime: 60000, // 1 minute - trust cached data longer
    gcTime: 600000, // Keep in cache for 10 minutes
    placeholderData: (previousData) => previousData, // Keep showing old data while loading
    refetchOnWindowFocus: false, // Don't refetch when tab regains focus
    retry: 1,
    retryDelay: 500,
  });
}

/**
 * Hook to fetch all charging points (backwards compatible)
 */
export function useLocationsWithChargers() {
  return useChargingPoints();
}

/**
 * Hook to fetch only available charging points
 */
export function useAvailablePoints() {
  return useChargingPoints({ status: "AVAILABLE" });
}

/**
 * Hook to fetch points within map bounds
 */
export function usePointsInBounds(bounds: BoundingBox | null) {
  return useChargingPoints({ 
    bounds: bounds || undefined, 
    enabled: !!bounds 
  });
}

/**
 * Helper to determine if an error is a network/API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return error.message;
  }
  
  if (error instanceof Error)
 {
    return error.message;
  }
  
  return "An unexpected error occurred. Please try again.";
}

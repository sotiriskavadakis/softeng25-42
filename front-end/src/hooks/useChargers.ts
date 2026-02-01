import { useQuery } from "@tanstack/react-query";
import { fetchAllPoints, ChargingPoint } from "@/lib/api/points";
import { Charger, ChargerStatus } from "@/types";

// Map API status to frontend status
const mapStatus = (apiStatus: string): ChargerStatus => {
  const statusMap: Record<string, ChargerStatus> = {
    AVAILABLE: "available",
    OCCUPIED: "occupied",
    BUSY: "occupied",
    RESERVED: "reserved",
    FAULTED: "faulted",
    OFFLINE: "offline",
  };
  return statusMap[apiStatus] || "offline";
};

export function useChargers() {
  return useQuery({
    queryKey: ["chargers"],
    queryFn: async (): Promise<Charger[]> => {
      // Fetch chargers from local API
      const points = await fetchAllPoints();

      // Transform to frontend Charger type
      return points.map((point: ChargingPoint) => ({
        chargerId: point.id,
        stationId: point.id,
        typeId: "1",
        typeName: `${point.capacity}kW`,
        status: mapStatus(point.status),
        maxPowerKw: point.capacity,
        tariffPerKwh: 0.35, // Default tariff
        locationName: point.providerName || "Unknown Location",
        locationAddress: "",
        latitude: point.latitude,
        longitude: point.longitude,
        rating: undefined,
      }));
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      // Fetch all points and group by location
      const points = await fetchAllPoints();
      
      // Group by coordinates to create location entries
      const locationMap = new Map<string, { 
        latitude: number; 
        longitude: number; 
        name: string;
        is_active: boolean;
      }>();
      
      for (const point of points) {
        const key = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            latitude: point.latitude,
            longitude: point.longitude,
            name: point.providerName || "Unknown Location",
            is_active: point.status !== "OFFLINE",
          });
        }
      }
      
      return Array.from(locationMap.values());
    },
  });
}

export function useChargerTypes() {
  return useQuery({
    queryKey: ["charger-types"],
    queryFn: async () => {
      // Return common charger types statically since API doesn't have this endpoint
      return [
        { type_id: 1, name: "Type 2", max_supported_power: 22, icon_url: null },
        { type_id: 2, name: "CCS", max_supported_power: 150, icon_url: null },
        { type_id: 3, name: "CHAdeMO", max_supported_power: 50, icon_url: null },
      ];
    },
  });
}

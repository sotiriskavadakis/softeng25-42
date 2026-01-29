import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Charger, ChargerStatus } from "@/types";

// Map database status to frontend status
const mapStatus = (dbStatus: string | null): ChargerStatus => {
  const statusMap: Record<string, ChargerStatus> = {
    AVAILABLE: "available",
    OCCUPIED: "occupied",
    RESERVED: "reserved",
    FAULTED: "faulted",
    OFFLINE: "offline",
  };
  return statusMap[dbStatus || "OFFLINE"] || "offline";
};

export function useChargers() {
  return useQuery({
    queryKey: ["chargers"],
    queryFn: async (): Promise<Charger[]> => {
      // Fetch chargers with joined data
      const { data: chargers, error: chargersError } = await supabase
        .from("chargers")
        .select(`
          charger_id,
          station_id,
          type_id,
          status,
          max_power_kw,
          charger_types (
            name,
            max_supported_power
          ),
          stations (
            station_id,
            physical_id,
            location_id,
            locations (
              location_id,
              name,
              address,
              latitude,
              longitude,
              score
            )
          )
        `);

      if (chargersError) throw chargersError;

      // Transform to frontend Charger type
      return (chargers || []).map((c) => {
        const station = c.stations;
        const location = station?.locations;
        const chargerType = c.charger_types;

        return {
          chargerId: String(c.charger_id),
          stationId: String(c.station_id),
          typeId: String(c.type_id),
          typeName: chargerType?.name || "Unknown",
          status: mapStatus(c.status),
          maxPowerKw: Number(c.max_power_kw) || 0,
          tariffPerKwh: 0.35, // Default tariff, could be added to schema later
          locationName: location?.name || "Unknown Location",
          locationAddress: location?.address || "",
          latitude: Number(location?.latitude) || 0,
          longitude: Number(location?.longitude) || 0,
          rating: Number(location?.score) || undefined,
        };
      });
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });
}

export function useChargerTypes() {
  return useQuery({
    queryKey: ["charger-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("charger_types").select("*");

      if (error) throw error;
      return data;
    },
  });
}

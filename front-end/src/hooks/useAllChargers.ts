import { useQuery } from "@tanstack/react-query";
import { fetchAllPoints, ChargingPoint } from "@/lib/api/points";

/**
 * Hook to fetch ALL charging points globally (not filtered by map bounds)
 * This provides a complete dataset for statistics and global search
 */
export function useAllChargers() {
  return useQuery({
    queryKey: ["all-charging-points"],
    queryFn: async (): Promise<ChargingPoint[]> => {
      return fetchAllPoints();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - global data doesn't need to refresh often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Get statistics from all chargers
 */
export function useAllChargersStats() {
  const { data: allChargers = [], ...rest } = useAllChargers();
  
  const stats = {
    total: allChargers.length,
    available: allChargers.filter(c => c.status === "AVAILABLE").length,
    busy: allChargers.filter(c => c.status === "BUSY").length,
    offline: allChargers.filter(c => c.status === "OFFLINE").length,
    totalCapacity: allChargers.reduce((sum, c) => sum + c.capacity, 0),
    averageCapacity: allChargers.length > 0 
      ? allChargers.reduce((sum, c) => sum + c.capacity, 0) / allChargers.length 
      : 0,
    maxCapacity: allChargers.length > 0 
      ? Math.max(...allChargers.map(c => c.capacity))
      : 0,
    minCapacity: allChargers.length > 0 
      ? Math.min(...allChargers.map(c => c.capacity))
      : 0,
  };

  return { stats, chargers: allChargers, ...rest };
}

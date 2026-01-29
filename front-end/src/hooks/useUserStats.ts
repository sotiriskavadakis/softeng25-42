import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/api/client";

export interface UserStats {
  totalSessions: number;
  totalKwh: number;
  totalSpent: number;
  co2Saved: number;
  averageSessionDuration: number;
  favoriteLocation: string | null;
}

export interface MonthlyUsage {
  month: string;
  year: number;
  totalKwh: number;
  totalCost: number;
  sessionCount: number;
}

// CO2 saved per kWh (kg) - EV vs average gas car emissions
const CO2_SAVED_PER_KWH = 0.45;

/**
 * User stats hook
 * Note: This requires a /api/user/stats endpoint on the backend
 * For now, returns placeholder data since the API doesn't have this endpoint yet
 */
export function useUserStatsData() {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: async (): Promise<{ stats: UserStats; monthlyUsage: MonthlyUsage[] }> => {
      const token = getAuthToken();
      
      if (!token) {
        return {
          stats: {
            totalSessions: 0,
            totalKwh: 0,
            totalSpent: 0,
            co2Saved: 0,
            averageSessionDuration: 0,
            favoriteLocation: null,
          },
          monthlyUsage: [],
        };
      }

      // TODO: Implement when /api/user/stats endpoint is available
      // For now, return placeholder stats based on token existence
      // This prevents crashes and shows the user is authenticated
      
      return {
        stats: {
          totalSessions: 0,
          totalKwh: 0,
          totalSpent: 0,
          co2Saved: 0,
          averageSessionDuration: 0,
          favoriteLocation: null,
        },
        monthlyUsage: [],
      };
    },
    enabled: !!getAuthToken(),
  });
}

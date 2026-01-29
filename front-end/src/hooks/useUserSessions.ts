import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/api/client";

export interface UserSession {
  sessionId: number;
  chargerId: number | null;
  startTime: string;
  endTime: string | null;
  totalKwh: number;
  totalCost: number;
  chargerName: string;
  locationName: string;
  locationAddress: string;
  connectorType: string;
  maxPowerKw: number;
  isActive: boolean;
}

export interface UserReservation {
  reservationId: number;
  chargerId: number;
  startTime: string;
  durationMinutes: number;
  chargerName: string;
  locationName: string;
  locationAddress: string;
  connectorType: string;
  maxPowerKw: number;
}

/**
 * Fetch user's charging sessions
 * Note: Requires /api/sessions/user endpoint on the backend
 */
export function useUserSessions() {
  return useQuery({
    queryKey: ["user-sessions"],
    queryFn: async (): Promise<UserSession[]> => {
      const token = getAuthToken();
      
      if (!token) {
        return [];
      }

      // TODO: Implement when /api/sessions/user endpoint is available
      // For now, return empty array to prevent crashes
      return [];
    },
    enabled: !!getAuthToken(),
  });
}

/**
 * Get active charging session
 * Note: Requires /api/sessions/active endpoint on the backend
 */
export function useActiveSession() {
  return useQuery({
    queryKey: ["active-session"],
    queryFn: async (): Promise<UserSession | null> => {
      const token = getAuthToken();
      
      if (!token) {
        return null;
      }

      // TODO: Implement when /api/sessions/active endpoint is available
      return null;
    },
    enabled: !!getAuthToken(),
  });
}

/**
 * Fetch user's reservations
 * Note: Requires /api/reservations/user endpoint on the backend
 */
export function useUserReservations() {
  return useQuery({
    queryKey: ["user-reservations"],
    queryFn: async (): Promise<UserReservation[]> => {
      const token = getAuthToken();
      
      if (!token) {
        return [];
      }

      // TODO: Implement when /api/reservations/user endpoint is available
      return [];
    },
    enabled: !!getAuthToken(),
  });
}

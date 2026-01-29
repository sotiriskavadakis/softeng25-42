import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api/client";

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string | null;
}

interface ApiUserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}

/**
 * Fetch user profile from the custom JWT backend
 * Falls back to extracting info from JWT token if no profile endpoint exists
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile | null> => {
      const token = getAuthToken();
      
      if (!token) {
        return null;
      }

      // Try to decode JWT to get user info (JWT payload is base64 encoded)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        return {
          id: payload.sub || payload.user_id || "unknown",
          email: payload.email || "user@example.com",
          username: payload.username || null,
          firstName: payload.first_name || payload.firstName || null,
          lastName: payload.last_name || payload.lastName || null,
          createdAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
        };
      } catch {
        // If JWT decode fails, return minimal profile
        return {
          id: "unknown",
          email: "user@example.com",
          username: null,
          firstName: null,
          lastName: null,
          createdAt: null,
        };
      }
    },
    enabled: !!getAuthToken(),
  });
}

/**
 * Update user profile
 * Note: This requires a /profile endpoint on the backend
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<{
      username: string;
      firstName: string;
      lastName: string;
    }>) => {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Call profile update endpoint if it exists
      // For now, just invalidate and let the UI update optimistically
      console.log("[useUpdateProfile] Update requested:", updates);
      
      // TODO: Implement when /api/profile endpoint is available
      // await apiFetch("profile", {}, { method: "PUT", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

/**
 * Fetch saved payment cards
 * Note: This requires a /cards endpoint on the backend
 */
export function useSavedCards() {
  return useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () => {
      const token = getAuthToken();
      
      if (!token) {
        return [];
      }

      // TODO: Implement when /api/cards endpoint is available
      // For now, return empty array
      return [];
    },
    enabled: !!getAuthToken(),
  });
}

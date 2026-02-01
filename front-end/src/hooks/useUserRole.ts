import { useQuery } from "@tanstack/react-query";
import { getAuthToken, apiFetch } from "@/lib/api/client";

export type AppRole = "admin" | "user";

interface UserProfileResponse {
  role?: string;
  is_admin?: boolean;
}

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async (): Promise<AppRole | null> => {
      const token = getAuthToken();
      if (!token) return null;

      try {
        // Try to get user profile/role from the local API
        // If your API has a user profile endpoint, use it here
        const response = await apiFetch<UserProfileResponse>("user/profile", {});
        return response.is_admin ? "admin" : "user";
      } catch {
        // If profile endpoint doesn't exist or fails, default to "user"
        return "user";
      }
    },
    enabled: !!getAuthToken(), // Only run query if authenticated
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === "admin", isLoading };
}

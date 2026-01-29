import { useQuery } from "@tanstack/react-query";
import { fetchHealthCheck, HealthCheckResult, ApiError } from "@/lib/api/points";

/**
 * Hook to fetch system health check
 */
export function useHealthCheck(enabled = true) {
  return useQuery({
    queryKey: ["healthcheck"],
    queryFn: fetchHealthCheck,
    enabled,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute when window is focused
    retry: 1,
  });
}

/**
 * Get user-friendly error message for health check errors
 */
export function getHealthCheckErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return "Unable to connect to the server.";
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Failed to load health check";
}

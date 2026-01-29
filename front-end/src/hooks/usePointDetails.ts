import { useQuery } from "@tanstack/react-query";
import { fetchPointDetails, PointDetails, ApiError } from "@/lib/api/points";

export type { PointDetails };

/**
 * Hook to fetch point details by ID
 */
export function usePointDetails(pointId: string | null) {
  return useQuery({
    queryKey: ["point-details", pointId],
    queryFn: async (): Promise<PointDetails> => {
      if (!pointId) {
        throw new Error("Point ID is required");
      }
      return fetchPointDetails(pointId);
    },
    enabled: !!pointId,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Get user-friendly error message for point details errors
 */
export function getPointDetailsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return "Unable to connect to the server. Please check your connection.";
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Failed to load charger details";
}

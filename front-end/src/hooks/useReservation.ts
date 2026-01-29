import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reservePoint, ReservationResult, ApiError } from "@/lib/api/points";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/api/client";

interface UseReservationOptions {
  onSuccess?: (result: ReservationResult) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Hook to reserve a charging point
 */
export function useReservation(options: UseReservationOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      pointId,
      durationMinutes
    }: { 
      pointId: string;
      durationMinutes?: number;
    }): Promise<ReservationResult> => {
      // Check if user is authenticated before making the request
      const token = getAuthToken();
      if (!token) {
        throw new ApiError("Please log in to reserve a charger", 401, false);
      }
      
      return reservePoint(pointId, durationMinutes);
    },
    onSuccess: (result) => {
      // Invalidate point details to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["point-details", result.pointId] });
      queryClient.invalidateQueries({ queryKey: ["charging-points"] });

      if (result.success) {
        toast({
          title: "Reservation Confirmed",
          description: result.reservationEndTime 
            ? `Reserved until ${result.reservationEndTime.toLocaleTimeString()}`
            : "Your charger is reserved",
        });
      } else {
        // Reservation failed but no error thrown
        toast({
          title: "Reservation Failed",
          description: getReservationFailureMessage(result.status),
          variant: "destructive",
        });
      }

      options.onSuccess?.(result);
    },
    onError: (error: Error) => {
      const apiError = error instanceof ApiError ? error : new ApiError(error.message);
      
      toast({
        title: "Reservation Failed",
        description: getReservationErrorMessage(apiError),
        variant: "destructive",
      });

      options.onError?.(apiError);
    },
  });
}

/**
 * Get user-friendly message for reservation failures (non-error status)
 */
function getReservationFailureMessage(status: string): string {
  switch (status.toLowerCase()) {
    case "not_found":
      return "This charging point was not found.";
    case "occupied":
    case "charging":
    case "busy":
      return "This charger is currently in use.";
    case "reserved":
      return "This charger is already reserved.";
    case "offline":
      return "This charger is offline.";
    case "malfunction":
    case "faulted":
      return "This charger has a malfunction.";
    default:
      return `Unable to reserve: ${status}`;
  }
}

/**
 * Get user-friendly message for reservation errors
 */
function getReservationErrorMessage(error: ApiError): string {
  if (error.isNetworkError) {
    return "Unable to connect to the server. Please check your connection.";
  }
  
  return error.message || "An error occurred while making the reservation.";
}

/**
 * Check if an error is an API error
 */
export function isReservationApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

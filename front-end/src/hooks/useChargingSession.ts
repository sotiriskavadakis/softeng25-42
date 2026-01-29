import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  startCharging, 
  stopCharging, 
  createChargingSession,
  ChargingSessionData,
  ApiError 
} from "@/lib/api/charging";
import { toast } from "@/hooks/use-toast";
import { SessionMetrics } from "@/types";

export interface ActiveSession {
  pointId: string;
  chargerName: string;
  locationName: string;
  startTime: Date;
  startSoc: number;
  kwhPrice: number;
}

interface UseChargingSessionOptions {
  onSessionStarted?: (pointId: string) => void;
  onSessionEnded?: (pointId: string, metrics: SessionMetrics) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage an active charging session
 * - Starts charging by updating point status to OCCUPIED
 * - Tracks session metrics in real-time
 * - Stops charging by updating point status to AVAILABLE and recording session
 */
export function useChargingSession(options: UseChargingSessionOptions = {}) {
  const { onSessionStarted, onSessionEnded, onError } = options;
  const queryClient = useQueryClient();
  
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  
  // Track metrics update interval
  const metricsIntervalRef = useRef<number | null>(null);

  // Mutation to start charging (update point to OCCUPIED)
  const startMutation = useMutation({
    mutationFn: async (params: { 
      pointId: string; 
      chargerName: string; 
      locationName: string;
      kwhPrice: number;
      initialSoc?: number;
    }) => {
      const result = await startCharging(params.pointId);
      return { ...params, result };
    },
    onSuccess: (data) => {
      const { pointId, chargerName, locationName, kwhPrice, initialSoc = 45 } = data;
      
      // Set up active session
      const session: ActiveSession = {
        pointId,
        chargerName,
        locationName,
        startTime: new Date(),
        startSoc: initialSoc,
        kwhPrice,
      };
      
      setActiveSession(session);
      setIsCharging(true);
      
      // Initialize metrics
      const initialMetrics: SessionMetrics = {
        currentPower: 0,
        energyDelivered: 0,
        estimatedTimeRemaining: 60,
        batteryLevel: initialSoc,
        cost: 0,
        duration: 0,
      };
      setMetrics(initialMetrics);
      
      // Start metrics simulation
      startMetricsUpdates(session, initialMetrics);
      
      // Invalidate points cache so map updates
      queryClient.invalidateQueries({ queryKey: ["charging-points"] });
      
      onSessionStarted?.(pointId);
      
      toast({
        title: "Charging Started",
        description: `Now charging at ${locationName}`,
      });
    },
    onError: (error) => {
      console.error("Failed to start charging:", error);
      const message = error instanceof ApiError 
        ? error.message 
        : "Failed to start charging session";
      
      toast({
        title: "Charging Failed",
        description: message,
        variant: "destructive",
      });
      
      onError?.(error as Error);
    },
  });

  // Mutation to stop charging (update point to AVAILABLE and record session)
  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession || !metrics) {
        throw new Error("No active session to stop");
      }
      
      const endTime = new Date();
      
      // First, update point status back to AVAILABLE
      await stopCharging(activeSession.pointId);
      
      // Then record the session
      const sessionData: ChargingSessionData = {
        pointId: activeSession.pointId,
        startTime: activeSession.startTime,
        endTime,
        startSoc: activeSession.startSoc,
        endSoc: Math.round(metrics.batteryLevel),
        totalKwh: parseFloat(metrics.energyDelivered.toFixed(1)),
        kwhPrice: activeSession.kwhPrice,
        totalAmount: parseFloat(metrics.cost.toFixed(2)),
      };
      
      const result = await createChargingSession(sessionData);
      return { result, finalMetrics: metrics };
    },
    onSuccess: (data) => {
      const { finalMetrics } = data;
      
      // Stop metrics updates
      stopMetricsUpdates();
      
      // Notify callback
      onSessionEnded?.(activeSession!.pointId, finalMetrics);
      
      // Clear session state
      setActiveSession(null);
      setIsCharging(false);
      setMetrics(null);
      
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["charging-points"] });
      queryClient.invalidateQueries({ queryKey: ["point-details"] });
      
      toast({
        title: "Charging Complete",
        description: `Session ended. Total: €${finalMetrics.cost.toFixed(2)} for ${finalMetrics.energyDelivered.toFixed(1)} kWh`,
      });
    },
    onError: (error) => {
      console.error("Failed to stop charging:", error);
      const message = error instanceof ApiError 
        ? error.message 
        : "Failed to end charging session";
      
      toast({
        title: "Error Ending Session",
        description: message,
        variant: "destructive",
      });
      
      onError?.(error as Error);
    },
  });

  // Start metrics simulation (for demo purposes - in production this would come from OCPP)
  const startMetricsUpdates = useCallback((session: ActiveSession, initial: SessionMetrics) => {
    let currentMetrics = { ...initial };
    
    metricsIntervalRef.current = window.setInterval(() => {
      currentMetrics = {
        // Simulate power fluctuation
        currentPower: Math.max(0, 142 + (Math.random() - 0.5) * 20),
        // Energy increases over time
        energyDelivered: currentMetrics.energyDelivered + 0.1,
        // Time decreases
        estimatedTimeRemaining: Math.max(0, currentMetrics.estimatedTimeRemaining - 0.1),
        // Battery increases
        batteryLevel: Math.min(100, currentMetrics.batteryLevel + 0.15),
        // Cost increases based on energy and price
        cost: currentMetrics.cost + (0.1 * session.kwhPrice),
        // Duration increases
        duration: currentMetrics.duration + (1 / 60),
      };
      
      setMetrics({ ...currentMetrics });
    }, 1000);
  }, []);

  const stopMetricsUpdates = useCallback(() => {
    if (metricsIntervalRef.current !== null) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  }, []);

  // Start charging function
  const start = useCallback((params: {
    pointId: string;
    chargerName: string;
    locationName: string;
    kwhPrice: number;
    initialSoc?: number;
  }) => {
    startMutation.mutate(params);
  }, [startMutation]);

  // Stop charging function
  const stop = useCallback(() => {
    stopMutation.mutate();
  }, [stopMutation]);

  // Close overlay without stopping (user just minimizes)
  const close = useCallback(() => {
    // Don't actually stop the session, just hide UI
    // Session continues in background
  }, []);

  return {
    // State
    isCharging,
    activeSession,
    metrics,
    
    // Loading states
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    
    // Actions
    start,
    stop,
    close,
  };
}

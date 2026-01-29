export type SessionStatus = "active" | "completed" | "cancelled";

export interface ChargingSession {
  sessionId: string;
  chargerId: string;
  chargerName: string;
  locationName: string;
  userId: string;
  cardId?: string;
  startTime: Date;
  endTime?: Date;
  totalKwh: number;
  totalCost: number;
  status: SessionStatus;
  // Live metrics for active sessions
  currentPower?: number;
  batteryLevel?: number;
  estimatedTimeRemaining?: number;
}

export interface SessionMetrics {
  currentPower: number;
  energyDelivered: number;
  estimatedTimeRemaining: number;
  batteryLevel: number;
  cost: number;
  duration: number; // in minutes
}

// Reservation matching SRS requirements
export interface Reservation {
  reservationId: string;
  userId: string;
  chargerId: string;
  chargerName: string;
  locationName: string;
  startTime: Date;
  durationMinutes: number; // 15-60 as per SRS
  status: "active" | "expired" | "cancelled" | "completed";
  preAuthAmount?: number;
}

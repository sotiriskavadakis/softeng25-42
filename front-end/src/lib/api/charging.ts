/**
 * Charging Session API Client
 * 
 * Handles starting/stopping charging sessions and updating point status.
 * Based on Swagger spec endpoints:
 * - POST /api/updpoint/{id} - Update point status
 * - POST /api/newsession - Create new charging session
 */

import { apiFetch, ApiError } from "./client";

// Re-export ApiError for consumers
export { ApiError };

// =============================================================================
// API Request/Response Types (from Swagger definitions)
// =============================================================================

// handlers.UpdatePointRequest
// NOTE: API accepts these values but external backend has a bug where database constraint rejects them
// The API maintainers need to fix the mapping between input validation and database storage
export interface UpdatePointRequest {
  status?: "available" | "charging" | "reserved" | "malfunction" | "offline";
  kwhprice?: number;
  is_manual_price?: boolean;
}

// handlers.UpdatePointResponse
export interface UpdatePointResponse {
  pointid: string;
  status: string;
  kwhprice: number | null;
  is_manual_price: boolean;
}

// handlers.NewSessionRequest
export interface NewSessionRequest {
  pointid: string;
  starttime: string;   // Format: YYYY-MM-DD HH:MM
  endtime: string;     // Format: YYYY-MM-DD HH:MM
  startsoc: number;    // Start state of charge (0-100)
  endsoc: number;      // End state of charge (0-100)
  totalkwh: number;    // Total energy delivered
  kwhprice: number;    // Price per kWh
  amount: number;      // Total amount charged (API uses "amount" not "totalamount")
}

// handlers.NewSessionResponse
export interface NewSessionResponse {
  sessionid: string;
  pointid: string;
  starttime: string;
  endtime: string;
  totalkwh: number;
  totalamount: number;
}

// =============================================================================
// Frontend Models
// =============================================================================

// API accepts these values per validation error message
export type PointStatusUpdate = "available" | "charging" | "reserved" | "malfunction" | "offline";

export interface ChargingSessionData {
  pointId: string;
  startTime: Date;
  endTime: Date;
  startSoc: number;
  endSoc: number;
  totalKwh: number;
  kwhPrice: number;
  totalAmount: number;
}

export interface ChargingSessionResult {
  sessionId: string;
  pointId: string;
  startTime: Date;
  endTime: Date;
  totalKwh: number;
  totalAmount: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a Date to the API's expected format: YYYY-MM-DD HH:MM
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Update a charging point's status
 * API: POST /api/updpoint/{id}
 * 
 * @param pointId - The point to update
 * @param status - New status (AVAILABLE, OCCUPIED, etc.)
 * @param options - Optional pricing updates
 */
export async function updatePointStatus(
  pointId: string,
  status: PointStatusUpdate,
  options?: { kwhPrice?: number; isManualPrice?: boolean }
): Promise<UpdatePointResponse> {
  const body: UpdatePointRequest = {
    status,
  };

  if (options?.kwhPrice !== undefined) {
    body.kwhprice = options.kwhPrice;
  }

  if (options?.isManualPrice !== undefined) {
    body.is_manual_price = options.isManualPrice;
  }

  const data = await apiFetch<UpdatePointResponse>(
    "updpoint",
    { pointid: pointId },
    { 
      method: "POST",
      body, // Pass raw object - apiFetch handles JSON.stringify
    }
  );

  if (!data || !data.pointid) {
    throw new ApiError("API returned invalid update response", 500, false);
  }

  return data;
}

/**
 * Start charging - sets point status to "charging"
 * NOTE: External API has a bug - accepts "charging" but database expects different value
 * 
 * @param pointId - The point to start charging at
 */
export async function startCharging(pointId: string): Promise<UpdatePointResponse> {
  return updatePointStatus(pointId, "charging");
}

/**
 * Stop charging - sets point status back to "available"
 * 
 * @param pointId - The point to stop charging at
 */
export async function stopCharging(pointId: string): Promise<UpdatePointResponse> {
  return updatePointStatus(pointId, "available");
}

/**
 * Create a new charging session record
 * API: POST /api/newsession
 * 
 * @param session - Session data to record
 */
export async function createChargingSession(
  session: ChargingSessionData
): Promise<ChargingSessionResult> {
  const requestBody: NewSessionRequest = {
    pointid: session.pointId,
    starttime: formatDateTime(session.startTime),
    endtime: formatDateTime(session.endTime),
    startsoc: session.startSoc,
    endsoc: session.endSoc,
    totalkwh: session.totalKwh,
    kwhprice: session.kwhPrice,
    amount: session.totalAmount,  // API uses "amount" not "totalamount"
  };

  const data = await apiFetch<NewSessionResponse>(
    "newsession",
    {},
    {
      method: "POST",
      body: requestBody, // Pass raw object - apiFetch handles JSON.stringify
    }
  );

  if (!data || !data.sessionid) {
    throw new ApiError("API returned invalid session response", 500, false);
  }

  return {
    sessionId: data.sessionid,
    pointId: data.pointid,
    startTime: new Date(data.starttime),
    endTime: new Date(data.endtime),
    totalKwh: data.totalkwh,
    totalAmount: data.totalamount,
  };
}

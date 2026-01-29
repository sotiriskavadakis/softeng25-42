/**
 * Charging Points API Client
 * 
 * All API calls go through the central API client.
 * Based on Swagger spec - single source of truth.
 */

import { apiFetch, ApiError } from "./client";

// Re-export ApiError for consumers
export { ApiError };

// =============================================================================
// API Response Types (from Swagger definitions)
// =============================================================================

// handlers.PointVague - List view response
export interface ApiChargingPoint {
  pointid: string;
  lat: string;
  lon: string;
  status: string;
  cap: number;
  providerΝame?: string;  // Note: Greek N character in API
  providerName?: string;  // Handle both spellings defensively
}

// handlers.PointDetailDTO - Detail view response
export interface ApiPointDetails {
  pointid: string;
  status: string;
  cap: number;
  reservationendtime: string | null;
  kwhprice: number | null;
  is_manual_price: boolean;
  lat: string;
  lon: string;
}

// handlers.ReserveResponseDTO
export interface ApiReserveResponse {
  pointid: string;
  status: string;  // "reserved", "not_found", or current status if unavailable
  reservationendtime: string;  // "1970-01-01 00:00" if failed
}

// handlers.HealthCheckResponse
export interface ApiHealthCheckResponse {
  status: string;
  dbconnection: string;
  n_charge_points: number;
  n_charge_points_online: number;
  n_charge_points_offline: number;
}

// handlers.ErrorLogResponse - Standard API error format
export interface ApiErrorResponse {
  call: string;
  timeref: string;
  originator: string;
  return_code: number;
  error: string;
  debuginfo: string;
}

// =============================================================================
// Frontend Models (normalized from API responses)
// =============================================================================

export type PointStatus = "AVAILABLE" | "OFFLINE" | "BUSY" | "ONLINE";

export interface ChargingPoint {
  id: string;
  providerName: string;
  latitude: number;
  longitude: number;
  status: PointStatus;
  capacity: number;
}

export interface PointDetails {
  pointId: string;
  status: PointStatus;
  capacity: number;
  reservationEndTime: Date | null;
  kwhPrice: number | null;
  isManualPrice: boolean;
  latitude: number;
  longitude: number;
}

export interface ReservationResult {
  pointId: string;
  success: boolean;
  status: string;
  reservationEndTime: Date | null;
}

export interface HealthCheckResult {
  status: string;
  totalPoints: number;
  onlinePoints: number;
  offlinePoints: number;
}

export interface BoundingBox {
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
}

export interface PointsQueryParams {
  status?: string;
  bounds?: BoundingBox;
}

// =============================================================================
// Status Normalization
// =============================================================================

function normalizeStatus(status: string): PointStatus {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "AVAILABLE":
    case "ONLINE":
      return "AVAILABLE";
    case "OFFLINE":
      return "OFFLINE";
    case "BUSY":
    case "OCCUPIED":
    case "CHARGING":
    case "RESERVED":
      return "BUSY";
    case "MALFUNCTION":
    case "FAULTED":
      return "OFFLINE";
    default:
      return "OFFLINE";
  }
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformApiPoint(apiPoint: ApiChargingPoint): ChargingPoint {
  // Handle both spellings of providerName defensively
  const providerName = apiPoint.providerΝame || apiPoint.providerName || "Unknown Provider";
  
  return {
    id: apiPoint.pointid,
    providerName,
    latitude: parseFloat(apiPoint.lat) || 0,
    longitude: parseFloat(apiPoint.lon) || 0,
    status: normalizeStatus(apiPoint.status),
    capacity: apiPoint.cap || 0,
  };
}

function transformPointDetails(apiDetails: ApiPointDetails): PointDetails {
  // Parse reservation end time, treating 1970 dates as null
  let reservationEndTime: Date | null = null;
  if (apiDetails.reservationendtime) {
    const parsed = new Date(apiDetails.reservationendtime);
    // Treat epoch (1970) as no reservation
    if (parsed.getFullYear() > 1970) {
      reservationEndTime = parsed;
    }
  }

  return {
    pointId: apiDetails.pointid,
    status: normalizeStatus(apiDetails.status),
    capacity: apiDetails.cap || 0,
    reservationEndTime,
    kwhPrice: apiDetails.kwhprice,
    isManualPrice: apiDetails.is_manual_price ?? false,
    latitude: parseFloat(apiDetails.lat) || 0,
    longitude: parseFloat(apiDetails.lon) || 0,
  };
}

function transformReserveResponse(apiResponse: ApiReserveResponse): ReservationResult {
  const success = apiResponse.status === "reserved";
  
  let reservationEndTime: Date | null = null;
  if (success && apiResponse.reservationendtime) {
    const parsed = new Date(apiResponse.reservationendtime);
    if (parsed.getFullYear() > 1970) {
      reservationEndTime = parsed;
    }
  }

  return {
    pointId: apiResponse.pointid,
    success,
    status: apiResponse.status,
    reservationEndTime,
  };
}

function transformHealthCheck(apiResponse: ApiHealthCheckResponse): HealthCheckResult {
  return {
    status: apiResponse.status,
    totalPoints: apiResponse.n_charge_points,
    onlinePoints: apiResponse.n_charge_points_online,
    offlinePoints: apiResponse.n_charge_points_offline,
  };
}

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Fetch all charging points with optional filters
 */
export async function fetchAllPoints(params: PointsQueryParams = {}): Promise<ChargingPoint[]> {
  const queryParams: Record<string, string> = {};

  if (params.status) {
    queryParams.status = params.status;
  }

  if (params.bounds) {
    queryParams.min_lat = params.bounds.min_lat.toString();
    queryParams.max_lat = params.bounds.max_lat.toString();
    queryParams.min_lon = params.bounds.min_lon.toString();
    queryParams.max_lon = params.bounds.max_lon.toString();
  }

  const data = await apiFetch<ApiChargingPoint[]>("points", queryParams);

  if (!Array.isArray(data)) {
    throw new ApiError("API returned invalid response format", 500, false);
  }

  return data.map(transformApiPoint);
}

/**
 * Fetch only available charging points
 */
export async function fetchAvailablePoints(): Promise<ChargingPoint[]> {
  return fetchAllPoints({ status: "AVAILABLE" });
}

/**
 * Fetch charging points within a bounding box
 */
export async function fetchPointsInBounds(bounds: BoundingBox): Promise<ChargingPoint[]> {
  return fetchAllPoints({ bounds });
}

/**
 * Fetch available charging points within a bounding box
 */
export async function fetchAvailablePointsInBounds(bounds: BoundingBox): Promise<ChargingPoint[]> {
  return fetchAllPoints({ bounds, status: "AVAILABLE" });
}

/**
 * Fetch points with custom parameters
 */
export async function fetchPointsWithParams(params: PointsQueryParams): Promise<ChargingPoint[]> {
  return fetchAllPoints(params);
}

/**
 * Fetch point details by ID
 */
export async function fetchPointDetails(pointId: string): Promise<PointDetails> {
  const data = await apiFetch<ApiPointDetails>("point-details", { pointid: pointId });

  if (!data || !data.pointid) {
    throw new ApiError("API returned invalid point details format", 500, false);
  }

  return transformPointDetails(data);
}

/**
 * Reserve a charging point
 * API: POST /api/reserve/{id} or /api/reserve/{id}/{minutes}
 * @param pointId - The point to reserve
 * @param durationMinutes - Optional duration in minutes (15-60, defaults to 30)
 */
export async function reservePoint(pointId: string, durationMinutes?: number): Promise<ReservationResult> {
  const params: Record<string, string> = { pointid: pointId };
  
  // Add duration if provided (API uses path-based duration)
  if (durationMinutes) {
    // Clamp to valid range (15-60 minutes)
    const clampedMinutes = Math.min(60, Math.max(15, durationMinutes));
    params.minutes = clampedMinutes.toString();
  }

  const data = await apiFetch<ApiReserveResponse>("reserve", params, { method: "POST" });

  if (!data || !data.pointid) {
    throw new ApiError("API returned invalid reservation response", 500, false);
  }

  return transformReserveResponse(data);
}

/**
 * Fetch system health check
 */
export async function fetchHealthCheck(): Promise<HealthCheckResult> {
  const data = await apiFetch<ApiHealthCheckResponse>("healthcheck");

  if (!data || !data.status) {
    throw new ApiError("API returned invalid health check format", 500, false);
  }

  return transformHealthCheck(data);
}

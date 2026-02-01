/**
 * Session History Hook
 * 
 * Fetches charging sessions for a specific point within a date range.
 * Uses GET /api/sessions/{pointId}/{dateFrom}/{dateTo}
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api/client";

// API Response type based on spec
interface ApiSessionRecord {
  sessionid: string;
  pointid: string;
  starttime: string;
  endtime: string;
  startsoc: number;
  endsoc: number;
  totalkwh: number;
  kwhprice: number;
  totalamount: number;
}

// Frontend model
export interface SessionRecord {
  sessionId: string;
  pointId: string;
  startTime: Date;
  endTime: Date;
  startSoc: number;
  endSoc: number;
  totalKwh: number;
  kwhPrice: number;
  totalAmount: number;
}

interface UseSessionHistoryParams {
  pointId: string;
  dateFrom: Date;
  dateTo: Date;
}

/**
 * Format date to YYYYMMDD string for API
 */
function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Transform API response to frontend model
 */
function transformSession(apiSession: ApiSessionRecord): SessionRecord {
  return {
    sessionId: apiSession.sessionid,
    pointId: apiSession.pointid,
    startTime: new Date(apiSession.starttime),
    endTime: new Date(apiSession.endtime),
    startSoc: apiSession.startsoc,
    endSoc: apiSession.endsoc,
    totalKwh: apiSession.totalkwh,
    kwhPrice: apiSession.kwhprice,
    totalAmount: apiSession.totalamount,
  };
}

/**
 * Hook to fetch session history for a charging point
 */
export function useSessionHistory(params: UseSessionHistoryParams | null) {
  return useQuery({
    queryKey: ["session-history", params?.pointId, params?.dateFrom, params?.dateTo],
    queryFn: async (): Promise<SessionRecord[]> => {
      if (!params) {
        throw new Error("Session history params required");
      }

      const { pointId, dateFrom, dateTo } = params;

      const data = await apiFetch<ApiSessionRecord[]>("sessions", {
        pointid: pointId,
        from: formatDateParam(dateFrom),
        to: formatDateParam(dateTo),
      });

      if (!Array.isArray(data)) {
        throw new ApiError("API returned invalid session history format", 500, false);
      }

      return data.map(transformSession);
    },
    enabled: !!params?.pointId && !!params?.dateFrom && !!params?.dateTo,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

/**
 * Helper to get date range for last N days
 */
export function getLastNDaysRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

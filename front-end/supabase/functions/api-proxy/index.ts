/**
 * Unified API Proxy Edge Function
 * 
 * Routes all API calls through this proxy to avoid CORS issues with the ngrok domain.
 * 
 * Supported endpoints:
 * - POST /register - Register a new user (returns JWT)
 * - POST /login - Login user (returns JWT)
 * - GET /api/points?min_lat=&max_lat=&min_lon=&max_lon=&format=json - List points
 * - GET /api/point/{id} - Get point details
 * - POST /api/reserve/{id} - Reserve a point (requires auth)
 * - POST /api/updpoint/{id} - Update point status (requires auth)
 * - POST /api/newsession - Create new charging session (requires auth)
 * - GET /api/sessions/{pointid}/{from}/{to} - Get sessions for a point
 * - GET /api/pointstatus/{pointid}/{from}/{to} - Get point status history
 * - GET /api/admin/healthcheck - System health check
 */

const EXTERNAL_API_BASE = "https://heliced-evita-preblooming.ngrok-free.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ApiErrorResponse {
  call: string;
  timeref: string;
  originator: string;
  return_code: number;
  error: string;
  debuginfo: string;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "return_code" in data &&
    "error" in data
  );
}

// Input validation helpers
function isValidPointId(pointId: string | null): pointId is string {
  if (!pointId) return false;
  // Point ID should be numeric and reasonable length
  return /^\d{1,15}$/.test(pointId);
}

function isValidCoordinate(value: string | null, min: number, max: number): boolean {
  if (!value) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return false;
  // Format: YYYYMMDD
  return /^\d{8}$/.test(dateStr);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Authenticate user from JWT token (validates against external backend)
async function authenticateUser(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // For now, just check that a token is present
  // The external API will validate the token
  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) {
    return null;
  }

  // Return the token itself as the "user id" for logging purposes
  // The actual validation happens at the external API
  return token;
}

async function handleUpstreamResponse(
  response: Response,
  endpoint: string
): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  }

  const data = await response.json();

  if (isApiErrorResponse(data)) {
    console.error(`[api-proxy] API Error on ${endpoint}:`, JSON.stringify(data));
    return new Response(JSON.stringify(data), {
      status: data.return_code || response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function proxyRequest(
  method: string,
  path: string,
  body?: string
): Promise<Response> {
  const upstreamUrl = `${EXTERNAL_API_BASE}${path}`;
  
  console.log(`[api-proxy] ${method} ${upstreamUrl}`);

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body: body || undefined,
    });

    return handleUpstreamResponse(response, path);
  } catch (error) {
    console.error(`[api-proxy] Network error:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to upstream API",
        message: error instanceof Error ? error.message : "Unknown network error",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function proxyRequestWithAuth(
  method: string,
  path: string,
  authToken: string | null,
  body?: string
): Promise<Response> {
  const upstreamUrl = `${EXTERNAL_API_BASE}${path}`;
  
  console.log(`[api-proxy] ${method} ${upstreamUrl} (with auth)`);

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  // Forward the authorization header to the upstream API
  if (authToken) {
    headers["Authorization"] = authToken;
  }

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body: body || undefined,
    });

    return handleUpstreamResponse(response, path);
  } catch (error) {
    console.error(`[api-proxy] Network error:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to upstream API",
        message: error instanceof Error ? error.message : "Unknown network error",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  console.log(`[api-proxy] Action: ${action}, Method: ${req.method}`);

  try {
    switch (action) {
      // POST /register - Register a new user
      case "register": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed. Use POST." }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let body;
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { email, password, username, first_name, last_name } = body;
        // Also support camelCase for backwards compatibility
        const firstName = first_name || body.firstName;
        const lastName = last_name || body.lastName;

        if (!email || !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Valid email is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[api-proxy] Registering user: ${email}`);
        return proxyRequest("POST", "/api/auth/register", JSON.stringify({ 
          email, 
          password,
          username,
          first_name: firstName, 
          last_name: lastName 
        }));
      }

      // POST /login - Login user
      case "login": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed. Use POST." }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let body;
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { email, password } = body;

        if (!email || !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Valid email is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!password) {
          return new Response(
            JSON.stringify({ error: "Password is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[api-proxy] Login attempt: ${email}`);
        return proxyRequest("POST", "/api/auth/login", JSON.stringify({ email, password }));
      }

      // GET /api/points - List all points with optional filters (public)
      case "points": {
        const minLat = url.searchParams.get("min_lat");
        const maxLat = url.searchParams.get("max_lat");
        const minLon = url.searchParams.get("min_lon");
        const maxLon = url.searchParams.get("max_lon");

        // Validate coordinates if provided
        if (minLat && !isValidCoordinate(minLat, -90, 90)) {
          return new Response(
            JSON.stringify({ error: "Invalid min_lat parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (maxLat && !isValidCoordinate(maxLat, -90, 90)) {
          return new Response(
            JSON.stringify({ error: "Invalid max_lat parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (minLon && !isValidCoordinate(minLon, -180, 180)) {
          return new Response(
            JSON.stringify({ error: "Invalid min_lon parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (maxLon && !isValidCoordinate(maxLon, -180, 180)) {
          return new Response(
            JSON.stringify({ error: "Invalid max_lon parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const params = new URLSearchParams();
        params.set("format", "json");
        
        const allowedParams = ["min_lat", "max_lat", "min_lon", "max_lon", "status"];
        for (const param of allowedParams) {
          const value = url.searchParams.get(param);
          if (value !== null) {
            params.set(param, value);
          }
        }

        const path = `/api/points?${params.toString()}`;
        return proxyRequest("GET", path);
      }

      // GET /api/point/{id} - Get point details (public)
      case "point-details": {
        const pointId = url.searchParams.get("pointid");
        if (!isValidPointId(pointId)) {
          return new Response(
            JSON.stringify({ error: "Invalid or missing pointid parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const path = `/api/point/${encodeURIComponent(pointId)}`;
        return proxyRequest("GET", path);
      }

      // POST /api/reserve/{id} or /api/reserve/{id}/{minutes} - Requires authentication
      case "reserve": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed. Use POST." }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Authenticate user for write operations
        const userId = await authenticateUser(req);
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pointId = url.searchParams.get("pointid");
        if (!isValidPointId(pointId)) {
          return new Response(
            JSON.stringify({ error: "Invalid or missing pointid parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const authToken = req.headers.get("authorization");
        
        // Check for custom duration (minutes parameter)
        const minutes = url.searchParams.get("minutes");
        let path: string;
        
        if (minutes) {
          // Validate minutes is a number between 15-60
          const mins = parseInt(minutes, 10);
          if (isNaN(mins) || mins < 15 || mins > 60) {
            return new Response(
              JSON.stringify({ error: "Minutes must be between 15 and 60" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          // Use /api/reserve/{id}/{minutes} format
          path = `/api/reserve/${encodeURIComponent(pointId)}/${mins}`;
        } else {
          // Default 30-minute reservation: /api/reserve/{id}
          path = `/api/reserve/${encodeURIComponent(pointId)}`;
        }

        console.log(`[api-proxy] User reserving point ${pointId} for ${minutes || '30'} minutes`);
        return proxyRequestWithAuth("POST", path, authToken);
      }

      // POST /api/updpoint/{id} - Update point status (requires auth)
      case "updpoint": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed. Use POST." }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Authenticate user for write operations
        const userId = await authenticateUser(req);
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pointId = url.searchParams.get("pointid");
        if (!isValidPointId(pointId)) {
          return new Response(
            JSON.stringify({ error: "Invalid or missing pointid parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[api-proxy] User updating point ${pointId}`);
        const body = await req.text();
        const path = `/api/updpoint/${encodeURIComponent(pointId)}`;
        const authToken = req.headers.get("authorization");
        return proxyRequestWithAuth("POST", path, authToken, body);
      }

      // POST /api/newsession - Create new charging session (requires auth)
      case "newsession": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed. Use POST." }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Authenticate user for write operations
        const userId = await authenticateUser(req);
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[api-proxy] User creating new session`);
        const body = await req.text();
        const authToken = req.headers.get("authorization");
        return proxyRequestWithAuth("POST", "/api/newsession", authToken, body);
      }

      // GET /api/sessions/{pointid}/{from}/{to} - Get sessions for a point (public read)
      case "sessions": {
        const pointId = url.searchParams.get("pointid");
        const fromDate = url.searchParams.get("from");
        const toDate = url.searchParams.get("to");

        if (!isValidPointId(pointId)) {
          return new Response(
            JSON.stringify({ error: "Invalid or missing pointid parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!isValidDateFormat(fromDate)) {
          return new Response(
            JSON.stringify({ error: "Invalid from date format. Use YYYYMMDD." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!isValidDateFormat(toDate)) {
          return new Response(
            JSON.stringify({ error: "Invalid to date format. Use YYYYMMDD." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const path = `/api/sessions/${encodeURIComponent(pointId)}/${encodeURIComponent(fromDate!)}/${encodeURIComponent(toDate!)}`;
        return proxyRequest("GET", path);
      }

      // GET /api/pointstatus/{pointid}/{from}/{to} - Get point status history (public read)
      case "pointstatus": {
        const pointId = url.searchParams.get("pointid");
        const fromDate = url.searchParams.get("from");
        const toDate = url.searchParams.get("to");

        if (!isValidPointId(pointId)) {
          return new Response(
            JSON.stringify({ error: "Invalid or missing pointid parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!isValidDateFormat(fromDate)) {
          return new Response(
            JSON.stringify({ error: "Invalid from date format. Use YYYYMMDD." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!isValidDateFormat(toDate)) {
          return new Response(
            JSON.stringify({ error: "Invalid to date format. Use YYYYMMDD." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const path = `/api/pointstatus/${encodeURIComponent(pointId)}/${encodeURIComponent(fromDate!)}/${encodeURIComponent(toDate!)}`;
        return proxyRequest("GET", path);
      }

      // GET /api/admin/healthcheck - System health (public)
      case "healthcheck": {
        return proxyRequest("GET", "/api/admin/healthcheck");
      }

      // GET /api/admin/resetpoints - Reset all chargers (public)
      case "resetpoints": {
        console.log(`[api-proxy] Resetting all points`);
        return proxyRequest("GET", "/api/admin/resetpoints");
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: "Unknown action",
            message: "Valid actions: points, point-details, reserve, updpoint, newsession, sessions, pointstatus, healthcheck" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error(`[api-proxy] Unexpected error:`, error);
    return new Response(
      JSON.stringify({
        error: "Internal proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

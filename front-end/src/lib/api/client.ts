/**
 * Central API Client
 * 
 * ALL API calls in the project must go through this module.
 * Handles JWT authentication, token storage, and 401 redirects.
 */

const AUTH_TOKEN_KEY = "auth_token";

// =============================================================================
// Token Management
// =============================================================================

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// =============================================================================
// API Client
// =============================================================================

const API_BASE_URL = "http://localhost:9876";

function getApiUrl(action: string): string {
  // Map actions to actual API endpoints
  const actionMap: Record<string, string> = {
    "healthcheck": "/api/admin/healthcheck",
    "register": "/api/auth/register",
    "login": "/api/auth/login",
    "points": "/api/points",
    "point": "/api/point",
    "point-details": "/api/point",
    "pointstatus": "/api/pointstatus",
    "reserve": "/api/reserve",
    "updpoint": "/api/updpoint",
    "newsession": "/api/newsession",
    "sessions": "/api/sessions",
    "payment/create-session": "/api/payment/create-session",
    "payment/capture": "/api/payment/capture",
    "payment/cancel": "/api/payment/cancel",
  };
  
  return `${API_BASE_URL}${actionMap[action] || `/api/${action}`}`;
}

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isNetworkError: boolean = false,
    public readonly apiError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Central fetch wrapper that handles:
 * - JWT token injection via Authorization header
 * - Content-Type headers for JSON bodies
 * - 401 handling with token clear and redirect
 */
export async function apiFetch<T>(
  action: string,
  params: Record<string, string> = {},
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, requiresAuth = false } = options;
  
  // Clone params to avoid mutating the original
  const pathParams = { ...params };
  
  // Build URL: append path params like :id to the base action URL
  let endpoint = getApiUrl(action);
  
  // Handle path parameters (e.g., id, pointid, from, to, minutes)
  if (pathParams.pointid) {
    endpoint += `/${pathParams.pointid}`;
    delete pathParams.pointid;
  }
  if (pathParams.id) {
    endpoint += `/${pathParams.id}`;
    delete pathParams.id;
  }
  if (pathParams.from && pathParams.to) {
    endpoint += `/${pathParams.from}/${pathParams.to}`;
    delete pathParams.from;
    delete pathParams.to;
  }
  if (pathParams.minutes) {
    endpoint += `/${pathParams.minutes}`;
    delete pathParams.minutes;
  }
  
  const url = new URL(endpoint);
  
  // Add remaining params as query string
  for (const [key, value] of Object.entries(pathParams)) {
    url.searchParams.set(key, value);
  }

  console.log(`[API] ${method} ${action}`, url.toString());

  // Build headers
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  // Add Content-Type for JSON bodies
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if token exists
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn("[API] 401 Unauthorized - clearing token and redirecting to login");
      clearAuthToken();
      window.location.href = "/login";
      throw new ApiError("Unauthorized", 401, false);
    }

    // Try to parse JSON response
    let data: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    // Check for error response
    if (!response.ok) {
      const errorMessage = 
        (data as { error?: string })?.error || 
        (data as { message?: string })?.message || 
        `API returned ${response.status}`;
      throw new ApiError(errorMessage, response.status, false, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        "Unable to connect to the backend API. The server may be offline.",
        0,
        true
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      500,
      false
    );
  }
}

// =============================================================================
// Auth API Functions
// =============================================================================

interface AuthResponse {
  token: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register a new user
 * POST /register
 */
export async function register(data: RegisterRequest): Promise<{ token: string }> {
  const response = await apiFetch<AuthResponse>("register", {}, {
    method: "POST",
    body: data,
  });
  return response;
}

/**
 * Login an existing user
 * POST /login
 */
export async function login(data: LoginRequest): Promise<{ token: string }> {
  const response = await apiFetch<AuthResponse>("login", {}, {
    method: "POST",
    body: data,
  });
  return response;
}

/**
 * Logout - clears token and redirects
 */
export function logout(): void {
  clearAuthToken();
  window.location.href = "/login";
}

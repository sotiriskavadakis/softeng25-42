/**
 * Centralized Database Client Module
 * 
 * All database access should go through the local API at localhost:9876.
 * This module provides error handling, retry logic, and consistent patterns.
 */

import { apiFetch, getAuthToken } from "@/lib/api/client";

// Error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly hint?: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class AuthenticationError extends DatabaseError {
  constructor(message: string = "User not authenticated") {
    super(message, "AUTH_REQUIRED");
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

// Retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth errors or validation errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt),
          config.maxDelayMs
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Helper to get the current authenticated user
export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const user = await apiFetch<{ id: string; email: string }>("user/profile", {});
    return user;
  } catch {
    return null;
  }
}

// Helper to require authentication
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

// Helper to handle API errors
export function handleApiError(error: { message: string; code?: string; details?: string; hint?: string }): never {
  throw new DatabaseError(error.message, error.code, error.details, error.hint);
}

// Schema introspection utilities
export const schema = {
  /**
   * Get table names from the database
   */
  getTableNames() {
    return [
      "charger_types",
      "chargers",
      "charging_sessions",
      "counties",
      "locations",
      "payment_methods",
      "profiles",
      "regions",
      "reservations",
      "saved_cards",
      "stations",
      "user_roles",
    ];
  },

  /**
   * Get enum values
   */
  getEnumValues(enumName: string): string[] {
    const enumMaps: Record<string, string[]> = {
      app_role: ["admin", "user"],
      charger_status: ["AVAILABLE", "OCCUPIED", "RESERVED", "FAULTED", "OFFLINE"],
    };
    return enumMaps[enumName] || [];
  },
};

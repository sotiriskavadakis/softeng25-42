/**
 * Centralized Database Client Module
 * 
 * All database access should go through this module.
 * Provides error handling, retry logic, and consistent patterns.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Re-export the supabase client for direct access when needed
export { supabase };

// Type exports for convenience
export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

export type TableName = keyof Tables;

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
      if (
        error instanceof AuthenticationError ||
        (error instanceof DatabaseError && error.code === "PGRST116") // No rows returned
      ) {
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw new DatabaseError(error.message, error.code);
  return user;
}

// Helper to require authentication
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: { message: string; code?: string; details?: string; hint?: string }): never {
  throw new DatabaseError(error.message, error.code, error.details, error.hint);
}

// Schema introspection utilities
export const schema = {
  /**
   * Get table names from the types
   */
  getTableNames(): TableName[] {
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
    ] as TableName[];
  },

  /**
   * Get enum values
   */
  getEnumValues<E extends keyof Enums>(enumName: E): Enums[E][] {
    const enumMaps: Record<string, string[]> = {
      app_role: ["admin", "user"],
      charger_status: ["AVAILABLE", "OCCUPIED", "RESERVED", "FAULTED", "OFFLINE"],
    };
    return (enumMaps[enumName] || []) as Enums[E][];
  },
};

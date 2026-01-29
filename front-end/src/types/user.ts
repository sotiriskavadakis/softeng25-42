export type UserRole = "user" | "admin" | "manager";

export interface User {
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

// User Statistics matching SRS Use Case 3
export interface UserStats {
  // Summary metrics
  totalSessions: number;
  totalKwh: number;
  totalSpent: number;
  co2Saved: number;
  averageSessionDuration: number; // in minutes
  favoriteLocation?: string;
  // Monthly breakdown for the last 6 months (analytical)
  monthlyUsage: MonthlyUsage[];
}

export interface MonthlyUsage {
  month: string;
  year: number;
  totalKwh: number;
  totalCost: number;
  sessionCount: number;
  averageCostPerKwh: number;
}

// Aggregated stats for periods > 6 months
export interface AggregatedStats {
  startDate: Date;
  endDate: Date;
  totalKwh: number;
  totalCost: number;
  sessionCount: number;
}


// Transaction History matching FR-07
export interface Transaction {
  transactionId: string;
  sessionId: string;
  userId: string;
  chargerId: string;
  chargerName: string;
  locationName: string;
  timestamp: Date;
  totalKwh: number;
  totalCost: number;
  paymentMethod: string;
  status: "completed" | "pending" | "failed" | "refunded";
}

// Saved payment methods
export interface SavedCard {
  cardId: string;
  userId: string;
  methodName: string;
  last4Digits: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

/**
 * Schema Metadata
 * 
 * Derived from the Supabase types file - provides detailed schema information
 * for the Data Dictionary and type-safe operations.
 */

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey: string[];
  foreignKeys: { column: string; referencedTable: string; referencedColumn: string }[];
  allowedOperations: ("SELECT" | "INSERT" | "UPDATE" | "DELETE")[];
  description?: string;
}

export interface EnumInfo {
  name: string;
  values: string[];
}

// Schema metadata derived from the generated types
export const schemaMetadata: {
  tables: TableInfo[];
  enums: EnumInfo[];
} = {
  tables: [
    {
      name: "charger_types",
      columns: [
        { name: "type_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "icon_url", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "max_supported_power", type: "numeric", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      primaryKey: ["type_id"],
      foreignKeys: [],
      allowedOperations: ["SELECT"],
      description: "Types of EV chargers (CCS, CHAdeMO, Type 2, etc.)",
    },
    {
      name: "chargers",
      columns: [
        { name: "charger_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "station_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "stations", foreignColumn: "station_id" },
        { name: "type_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "charger_types", foreignColumn: "type_id" },
        { name: "status", type: "charger_status", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "'OFFLINE'" },
        { name: "max_power_kw", type: "numeric", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      primaryKey: ["charger_id"],
      foreignKeys: [
        { column: "station_id", referencedTable: "stations", referencedColumn: "station_id" },
        { column: "type_id", referencedTable: "charger_types", referencedColumn: "type_id" },
      ],
      allowedOperations: ["SELECT"],
      description: "Individual charging units at stations",
    },
    {
      name: "charging_sessions",
      columns: [
        { name: "session_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "user_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, foreignTable: "profiles", foreignColumn: "id" },
        { name: "charger_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "chargers", foreignColumn: "charger_id" },
        { name: "card_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "saved_cards", foreignColumn: "card_id" },
        { name: "start_time", type: "timestamp with time zone", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "end_time", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "total_kwh", type: "numeric", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
        { name: "total_cost", type: "numeric", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
        { name: "created_at", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "now()" },
      ],
      primaryKey: ["session_id"],
      foreignKeys: [
        { column: "user_id", referencedTable: "profiles", referencedColumn: "id" },
        { column: "charger_id", referencedTable: "chargers", referencedColumn: "charger_id" },
        { column: "card_id", referencedTable: "saved_cards", referencedColumn: "card_id" },
      ],
      allowedOperations: ["SELECT", "INSERT", "UPDATE"],
      description: "User charging session records with RLS (users can only access their own)",
    },
    {
      name: "counties",
      columns: [
        { name: "name", type: "text", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "region_name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "regions", foreignColumn: "name" },
      ],
      primaryKey: ["name"],
      foreignKeys: [{ column: "region_name", referencedTable: "regions", referencedColumn: "name" }],
      allowedOperations: ["SELECT"],
      description: "Counties/administrative areas linked to regions",
    },
    {
      name: "locations",
      columns: [
        { name: "location_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "address", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "latitude", type: "numeric", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "longitude", type: "numeric", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "is_active", type: "boolean", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "true" },
        { name: "is_fast_charger", type: "boolean", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "false" },
        { name: "under_repair", type: "boolean", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "false" },
        { name: "coming_soon", type: "boolean", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "false" },
        { name: "station_count", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
        { name: "available_station_count", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "in_use_station_count", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "charger_types", type: "text[]", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "county_name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "counties", foreignColumn: "name" },
        { name: "score", type: "numeric", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
        { name: "access", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "1" },
        { name: "icon", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "icon_type", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "map_card_logo_url", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "url", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      primaryKey: ["location_id"],
      foreignKeys: [{ column: "county_name", referencedTable: "counties", referencedColumn: "name" }],
      allowedOperations: ["SELECT"],
      description: "EV charging station locations with aggregated charger data",
    },
    {
      name: "payment_methods",
      columns: [
        { name: "method_name", type: "text", nullable: false, isPrimaryKey: true, isForeignKey: false },
      ],
      primaryKey: ["method_name"],
      foreignKeys: [],
      allowedOperations: ["SELECT"],
      description: "Supported payment method types (Visa, Mastercard, etc.)",
    },
    {
      name: "profiles",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "email", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "username", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "first_name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "last_name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "created_at", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "now()" },
        { name: "updated_at", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "now()" },
      ],
      primaryKey: ["id"],
      foreignKeys: [],
      allowedOperations: ["SELECT", "INSERT", "UPDATE"],
      description: "User profile data with RLS (users can only access their own profile)",
    },
    {
      name: "regions",
      columns: [
        { name: "name", type: "text", nullable: false, isPrimaryKey: true, isForeignKey: false },
      ],
      primaryKey: ["name"],
      foreignKeys: [],
      allowedOperations: ["SELECT"],
      description: "Geographic regions for location grouping",
    },
    {
      name: "reservations",
      columns: [
        { name: "reservation_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "user_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, foreignTable: "profiles", foreignColumn: "id" },
        { name: "charger_id", type: "bigint", nullable: false, isPrimaryKey: false, isForeignKey: true, foreignTable: "chargers", foreignColumn: "charger_id" },
        { name: "start_time", type: "timestamp with time zone", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "duration_minutes", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "30" },
        { name: "created_at", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "now()" },
      ],
      primaryKey: ["reservation_id"],
      foreignKeys: [
        { column: "user_id", referencedTable: "profiles", referencedColumn: "id" },
        { column: "charger_id", referencedTable: "chargers", referencedColumn: "charger_id" },
      ],
      allowedOperations: ["SELECT", "INSERT", "UPDATE", "DELETE"],
      description: "Charger reservations with RLS (users can manage their own reservations)",
    },
    {
      name: "saved_cards",
      columns: [
        { name: "card_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "user_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, foreignTable: "profiles", foreignColumn: "id" },
        { name: "method_name", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "payment_methods", foreignColumn: "method_name" },
        { name: "last_4_digits", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "token", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      primaryKey: ["card_id"],
      foreignKeys: [
        { column: "user_id", referencedTable: "profiles", referencedColumn: "id" },
        { column: "method_name", referencedTable: "payment_methods", referencedColumn: "method_name" },
      ],
      allowedOperations: ["SELECT", "INSERT", "UPDATE", "DELETE"],
      description: "User saved payment cards with RLS (users can manage their own cards)",
    },
    {
      name: "stations",
      columns: [
        { name: "station_id", type: "bigint", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "auto-increment" },
        { name: "location_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: "locations", foreignColumn: "location_id" },
        { name: "physical_id", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "network_id", type: "bigint", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      primaryKey: ["station_id"],
      foreignKeys: [{ column: "location_id", referencedTable: "locations", referencedColumn: "location_id" }],
      allowedOperations: ["SELECT"],
      description: "Physical charging stations at locations",
    },
    {
      name: "user_roles",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: "gen_random_uuid()" },
        { name: "user_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "role", type: "app_role", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "'user'" },
        { name: "created_at", type: "timestamp with time zone", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "now()" },
      ],
      primaryKey: ["id"],
      foreignKeys: [],
      allowedOperations: ["SELECT"],
      description: "User roles for authorization (admin, user) - managed via security definer functions",
    },
  ],
  enums: [
    {
      name: "app_role",
      values: ["admin", "user"],
    },
    {
      name: "charger_status",
      values: ["AVAILABLE", "OCCUPIED", "RESERVED", "FAULTED", "OFFLINE"],
    },
  ],
};

// Helper to get table info
export function getTableInfo(tableName: string): TableInfo | undefined {
  return schemaMetadata.tables.find((t) => t.name === tableName);
}

// Helper to get column info
export function getColumnInfo(tableName: string, columnName: string): ColumnInfo | undefined {
  const table = getTableInfo(tableName);
  return table?.columns.find((c) => c.name === columnName);
}

// Helper to check if an operation is allowed on a table
export function isOperationAllowed(
  tableName: string,
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE"
): boolean {
  const table = getTableInfo(tableName);
  return table?.allowedOperations.includes(operation) ?? false;
}

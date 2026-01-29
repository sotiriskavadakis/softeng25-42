import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface ChargingPoint {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: "AVAILABLE" | "OFFLINE" | "BUSY";
  is_fast_charger: boolean;
  charger_types: string[];
  station_count: number;
  available_count: number | null;
  in_use_count: number | null;
  icon_url: string | null;
  external_url: string | null;
  score: number;
}

// Map database fields to API response
function mapLocationToPoint(loc: any): ChargingPoint {
  // Determine status based on location data
  let status: "AVAILABLE" | "OFFLINE" | "BUSY" = "AVAILABLE";
  
  if (!loc.is_active || loc.under_repair) {
    status = "OFFLINE";
  } else if (loc.available_station_count !== null && loc.available_station_count === 0) {
    status = "BUSY";
  } else if (
    loc.station_count !== null && 
    loc.in_use_station_count !== null && 
    loc.in_use_station_count >= loc.station_count
  ) {
    status = "BUSY";
  }

  return {
    id: loc.location_id,
    name: loc.name || "Unknown Location",
    address: loc.address || "",
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
    status,
    is_fast_charger: loc.is_fast_charger ?? false,
    charger_types: loc.charger_types || [],
    station_count: loc.station_count || 0,
    available_count: loc.available_station_count,
    in_use_count: loc.in_use_station_count,
    icon_url: loc.map_card_logo_url || loc.icon,
    external_url: loc.url,
    score: Number(loc.score) || 0,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const minLat = url.searchParams.get("min_lat");
    const maxLat = url.searchParams.get("max_lat");
    const minLon = url.searchParams.get("min_lon");
    const maxLon = url.searchParams.get("max_lon");

    // Build query
    let query = supabase
      .from("locations")
      .select("*")
      .eq("is_active", true);

    // Apply bounding box filters
    if (minLat !== null) {
      query = query.gte("latitude", parseFloat(minLat));
    }
    if (maxLat !== null) {
      query = query.lte("latitude", parseFloat(maxLat));
    }
    if (minLon !== null) {
      query = query.gte("longitude", parseFloat(minLon));
    }
    if (maxLon !== null) {
      query = query.lte("longitude", parseFloat(maxLon));
    }

    const { data: locations, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform to API format
    let points = (locations || []).map(mapLocationToPoint);

    // Filter by status (done in memory since it's derived)
    if (status) {
      const normalizedStatus = status.toUpperCase();
      points = points.filter((p) => p.status === normalizedStatus);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: points.length,
        data: points,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

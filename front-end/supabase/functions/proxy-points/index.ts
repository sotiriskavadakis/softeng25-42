const EXTERNAL_API_BASE = "https://heliced-evita-preblooming.ngrok-free.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Forward query parameters
    const params = new URLSearchParams();
    
    // Always include format=json
    params.set("format", "json");
    
    // Forward allowed params
    const allowedParams = ["min_lat", "max_lat", "min_lon", "max_lon", "status"];
    
    for (const param of allowedParams) {
      const value = url.searchParams.get(param);
      if (value !== null) {
        params.set(param, value);
      }
    }

    const queryString = params.toString();
    const upstreamUrl = `${EXTERNAL_API_BASE}/api/points?${queryString}`;
    
    console.log(`[proxy-points] Forwarding request to: ${upstreamUrl}`);

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!upstreamResponse.ok) {
      console.error(`[proxy-points] Upstream error: ${upstreamResponse.status} ${upstreamResponse.statusText}`);
      return new Response(
        JSON.stringify({
          error: "Upstream API error",
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await upstreamResponse.json();
    console.log(`[proxy-points] Success - received ${Array.isArray(data) ? data.length : 0} points`);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[proxy-points] Error:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to upstream API",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

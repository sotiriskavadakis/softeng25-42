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
    const pointId = url.searchParams.get("pointid");
    
    if (!pointId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: pointid" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call /api/pointID with the point ID
    const upstreamUrl = `${EXTERNAL_API_BASE}/api/pointID?pointid=${encodeURIComponent(pointId)}`;
    
    console.log(`[proxy-point-details] Fetching details for point: ${pointId}`);
    console.log(`[proxy-point-details] Upstream URL: ${upstreamUrl}`);

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!upstreamResponse.ok) {
      console.error(`[proxy-point-details] Upstream error: ${upstreamResponse.status} ${upstreamResponse.statusText}`);
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
    console.log(`[proxy-point-details] Success - received point details:`, JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[proxy-point-details] Error:`, error);
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

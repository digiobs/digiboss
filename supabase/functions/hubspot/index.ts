import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HUBSPOT_API_BASE = "https://api.hubapi.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  
  // Parse URL to get action from query params
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const limit = url.searchParams.get("limit") || "100";

  console.log(`HubSpot function called with action: ${action}`);

  // Status check
  if (action === "status") {
    return new Response(
      JSON.stringify({ 
        connected: !!accessToken,
        status: accessToken ? "connected" : "not_configured"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if token is configured for other actions
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return new Response(
      JSON.stringify({ error: "HubSpot not configured", connected: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    switch (action) {
      case "contacts": {
        console.log("Fetching HubSpot contacts");
        const properties = "firstname,lastname,email,company,phone,lifecyclestage,hs_lead_status,createdate,lastmodifieddate";
        
        const response = await fetch(
          `${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=${limit}&properties=${properties}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HubSpot API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to fetch contacts", details: errorText, connected: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await response.json();
        console.log(`Fetched ${data.results?.length || 0} contacts from HubSpot`);
        
        return new Response(
          JSON.stringify({ ...data, connected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deals": {
        console.log("Fetching HubSpot deals");
        const properties = "dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate";
        
        const response = await fetch(
          `${HUBSPOT_API_BASE}/crm/v3/objects/deals?limit=${limit}&properties=${properties}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HubSpot API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to fetch deals", details: errorText, connected: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await response.json();
        console.log(`Fetched ${data.results?.length || 0} deals from HubSpot`);
        
        return new Response(
          JSON.stringify({ ...data, connected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "companies": {
        console.log("Fetching HubSpot companies");
        const properties = "name,domain,industry,phone,city,country,numberofemployees,annualrevenue,createdate";
        
        const response = await fetch(
          `${HUBSPOT_API_BASE}/crm/v3/objects/companies?limit=${limit}&properties=${properties}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HubSpot API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to fetch companies", details: errorText, connected: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await response.json();
        console.log(`Fetched ${data.results?.length || 0} companies from HubSpot`);
        
        return new Response(
          JSON.stringify({ ...data, connected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "analytics": {
        console.log("Fetching HubSpot analytics summary");
        
        const [contactsRes, dealsRes, companiesRes] = await Promise.all([
          fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals?limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/companies?limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const [contactsData, dealsData, companiesData] = await Promise.all([
          contactsRes.json(),
          dealsRes.json(),
          companiesRes.json(),
        ]);

        const summary = {
          connected: true,
          contacts: { total: contactsData.total || 0 },
          deals: { total: dealsData.total || 0 },
          companies: { total: companiesData.total || 0 },
        };

        console.log("HubSpot analytics summary:", summary);
        return new Response(
          JSON.stringify(summary),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", connected: !!accessToken }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in HubSpot function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight
app.options("*", (c) => new Response(null, { headers: corsHeaders }));

const HUBSPOT_API_BASE = "https://api.hubapi.com";

// Get contacts
app.get("/contacts", async (c) => {
  console.log("Fetching HubSpot contacts");
  
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return c.json({ error: "HubSpot not configured" }, 500);
  }

  try {
    const limit = c.req.query("limit") || "100";
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
      return c.json({ error: "Failed to fetch contacts", details: errorText }, 400);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} contacts from HubSpot`);
    
    return c.json(data, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching HubSpot contacts:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get deals
app.get("/deals", async (c) => {
  console.log("Fetching HubSpot deals");
  
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return c.json({ error: "HubSpot not configured" }, 500);
  }

  try {
    const limit = c.req.query("limit") || "100";
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
      return c.json({ error: "Failed to fetch deals", details: errorText }, 400);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} deals from HubSpot`);
    
    return c.json(data, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching HubSpot deals:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get companies
app.get("/companies", async (c) => {
  console.log("Fetching HubSpot companies");
  
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return c.json({ error: "HubSpot not configured" }, 500);
  }

  try {
    const limit = c.req.query("limit") || "100";
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
      return c.json({ error: "Failed to fetch companies", details: errorText }, 400);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} companies from HubSpot`);
    
    return c.json(data, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching HubSpot companies:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get pipeline stages
app.get("/pipelines", async (c) => {
  console.log("Fetching HubSpot pipelines");
  
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return c.json({ error: "HubSpot not configured" }, 500);
  }

  try {
    const objectType = c.req.query("objectType") || "deals";
    
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/pipelines/${objectType}`,
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
      return c.json({ error: "Failed to fetch pipelines", details: errorText }, 400);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} pipelines from HubSpot`);
    
    return c.json(data, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching HubSpot pipelines:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get analytics summary
app.get("/analytics", async (c) => {
  console.log("Fetching HubSpot analytics summary");
  
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("HUBSPOT_ACCESS_TOKEN not configured");
    return c.json({ error: "HubSpot not configured" }, 500);
  }

  try {
    // Fetch contacts, deals, and companies counts in parallel
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
      contacts: {
        total: contactsData.total || 0,
      },
      deals: {
        total: dealsData.total || 0,
      },
      companies: {
        total: companiesData.total || 0,
      },
    };

    console.log("HubSpot analytics summary:", summary);
    return c.json(summary, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching HubSpot analytics:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);

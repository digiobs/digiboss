import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";

const app = new Hono();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google OAuth configuration
const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const REDIRECT_URI = Deno.env.get('GSC_REDIRECT_URI') || 'http://localhost';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GSCQuery {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResponse {
  rows?: GSCQuery[];
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange failed:', error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

// Fetch Search Console data
async function fetchGSCData(
  accessToken: string, 
  siteUrl: string, 
  startDate: string, 
  endDate: string,
  dimensions: string[] = ['query']
): Promise<GSCResponse> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit: 25,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GSC API error:', error);
    throw new Error(`GSC API failed: ${error}`);
  }

  return response.json();
}

// Get list of sites
async function fetchGSCSites(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GSC Sites API error:', error);
    throw new Error(`Failed to fetch sites: ${error}`);
  }

  return response.json();
}

// Generate OAuth URL
app.get('/auth-url', (c) => {
  const redirectUri = c.req.query('redirect_uri') || REDIRECT_URI;
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return c.json({ authUrl: authUrl.toString() }, 200, corsHeaders);
});

// Exchange code for tokens
app.post('/exchange-token', async (c) => {
  try {
    const { code, redirect_uri } = await c.req.json();
    
    if (!code) {
      return c.json({ error: 'Authorization code required' }, 400, corsHeaders);
    }

    // Override redirect URI if provided
    const originalRedirectUri = REDIRECT_URI;
    if (redirect_uri) {
      Deno.env.set('GSC_REDIRECT_URI', redirect_uri);
    }

    const tokens = await exchangeCodeForTokens(code);
    
    return c.json({ 
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Token exchange error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, corsHeaders);
  }
});

// Refresh token
app.post('/refresh-token', async (c) => {
  try {
    const { refresh_token } = await c.req.json();
    
    if (!refresh_token) {
      return c.json({ error: 'Refresh token required' }, 400, corsHeaders);
    }

    const tokens = await refreshAccessToken(refresh_token);
    
    return c.json({ 
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, corsHeaders);
  }
});

// Get available sites
app.post('/sites', async (c) => {
  try {
    const { access_token } = await c.req.json();
    
    if (!access_token) {
      return c.json({ error: 'Access token required' }, 400, corsHeaders);
    }

    const sites = await fetchGSCSites(access_token);
    
    return c.json(sites, 200, corsHeaders);
  } catch (error) {
    console.error('Sites fetch error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, corsHeaders);
  }
});

// Fetch search analytics data
app.post('/analytics', async (c) => {
  try {
    const { 
      access_token, 
      refresh_token,
      site_url, 
      start_date, 
      end_date,
      dimensions = ['query']
    } = await c.req.json();
    
    if (!site_url || !start_date || !end_date) {
      return c.json({ error: 'site_url, start_date, and end_date are required' }, 400, corsHeaders);
    }

    let token = access_token;
    let newAccessToken = null;

    // If no access token but refresh token provided, refresh it
    if (!token && refresh_token) {
      const refreshed = await refreshAccessToken(refresh_token);
      token = refreshed.access_token;
      newAccessToken = refreshed.access_token;
    }

    if (!token) {
      return c.json({ error: 'Access token or refresh token required' }, 400, corsHeaders);
    }

    const data = await fetchGSCData(token, site_url, start_date, end_date, dimensions);
    
    // Transform data for the dashboard
    const queries = (data.rows || []).map((row: GSCQuery) => ({
      query: row.keys[0],
      page: dimensions.includes('page') ? row.keys[dimensions.indexOf('page')] : null,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position.toFixed(1),
    }));

    // Calculate totals
    const totals = (data.rows || []).reduce((acc: { clicks: number; impressions: number }, row: GSCQuery) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
    }), { clicks: 0, impressions: 0 });

    return c.json({ 
      queries,
      totals,
      newAccessToken,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, corsHeaders);
  }
});

// Fetch page-level data
app.post('/pages', async (c) => {
  try {
    const { 
      access_token, 
      refresh_token,
      site_url, 
      start_date, 
      end_date 
    } = await c.req.json();
    
    if (!site_url || !start_date || !end_date) {
      return c.json({ error: 'site_url, start_date, and end_date are required' }, 400, corsHeaders);
    }

    let token = access_token;
    let newAccessToken = null;

    if (!token && refresh_token) {
      const refreshed = await refreshAccessToken(refresh_token);
      token = refreshed.access_token;
      newAccessToken = refreshed.access_token;
    }

    if (!token) {
      return c.json({ error: 'Access token or refresh token required' }, 400, corsHeaders);
    }

    const data = await fetchGSCData(token, site_url, start_date, end_date, ['page']);
    
    const pages = (data.rows || []).map((row: GSCQuery) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position.toFixed(1),
    }));

    return c.json({ 
      pages,
      newAccessToken,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Pages fetch error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, corsHeaders);
  }
});

// Handle CORS preflight
app.options('/*', (c) => {
  return c.body(null, 204, corsHeaders);
});

Deno.serve(app.fetch);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WRIKE_API_BASE = 'https://www.wrike.com/api/v4';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('WRIKE_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('WRIKE_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Wrike access token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'tasks';
    const folderId = url.searchParams.get('folderId');
    const spaceId = url.searchParams.get('spaceId');

    console.log(`Wrike API request: action=${action}, folderId=${folderId}, spaceId=${spaceId}`);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    let endpoint = '';
    let data: any = null;

    switch (action) {
      case 'spaces':
        // Get all spaces
        endpoint = `${WRIKE_API_BASE}/spaces`;
        break;

      case 'folders':
        // Get folders (optionally from a specific space)
        if (spaceId) {
          endpoint = `${WRIKE_API_BASE}/spaces/${spaceId}/folders`;
        } else {
          endpoint = `${WRIKE_API_BASE}/folders`;
        }
        break;

      case 'tasks':
        // Get tasks (optionally from a specific folder)
        if (folderId) {
          endpoint = `${WRIKE_API_BASE}/folders/${folderId}/tasks?fields=["description","briefDescription","parentIds","superParentIds","responsibleIds","importance","dates","customFields","authorIds","hasAttachments","superTaskIds","subTaskIds"]`;
        } else {
          endpoint = `${WRIKE_API_BASE}/tasks?fields=["description","briefDescription","parentIds","superParentIds","responsibleIds","importance","dates","customFields","authorIds","hasAttachments","superTaskIds","subTaskIds"]`;
        }
        break;

      case 'contacts':
        // Get contacts (users)
        endpoint = `${WRIKE_API_BASE}/contacts`;
        break;

      case 'workflows':
        // Get workflows (task statuses)
        endpoint = `${WRIKE_API_BASE}/workflows`;
        break;

      case 'account':
        // Get account info
        endpoint = `${WRIKE_API_BASE}/account`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching from Wrike: ${endpoint}`);

    const response = await fetch(endpoint, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Wrike API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Wrike API error: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    data = await response.json();
    console.log(`Wrike ${action} fetched successfully:`, JSON.stringify(data).substring(0, 500));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wrike edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

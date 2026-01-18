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

    console.log(`Wrike API request: method=${req.method}, action=${action}, folderId=${folderId}, spaceId=${spaceId}`);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    let endpoint = '';
    let data: any = null;
    let method = req.method;

    // Handle POST requests for creating tasks
    if (req.method === 'POST' && action === 'create-task') {
      const body = await req.json();
      const targetFolderId = body.folderId || folderId;
      
      if (!targetFolderId) {
        // Get the first available folder if none specified
        const foldersResponse = await fetch(`${WRIKE_API_BASE}/folders`, { headers });
        const foldersData = await foldersResponse.json();
        const firstFolder = foldersData.data?.find((f: any) => f.scope !== 'RbFolder');
        
        if (!firstFolder) {
          return new Response(
            JSON.stringify({ error: 'No folder found to create task in' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `${WRIKE_API_BASE}/folders/${firstFolder.id}/tasks`;
      } else {
        endpoint = `${WRIKE_API_BASE}/folders/${targetFolderId}/tasks`;
      }

      console.log(`Creating task in Wrike: ${endpoint}`, body);

      // Map priority to Wrike importance
      const importanceMap: Record<string, string> = {
        'high': 'High',
        'medium': 'Normal',
        'low': 'Low',
      };

      // Build Wrike task payload
      const wrikePayload: any = {
        title: body.title,
        description: body.description || '',
        importance: importanceMap[body.priority] || 'Normal',
      };

      if (body.dueDate) {
        wrikePayload.dates = { due: body.dueDate };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(wrikePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Wrike API error creating task: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            error: `Wrike API error: ${response.status}`,
            details: errorText 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      data = await response.json();
      console.log('Task created successfully:', JSON.stringify(data).substring(0, 500));

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET requests
    switch (action) {
      case 'spaces':
        endpoint = `${WRIKE_API_BASE}/spaces`;
        break;

      case 'folders':
        if (spaceId) {
          endpoint = `${WRIKE_API_BASE}/spaces/${spaceId}/folders`;
        } else {
          endpoint = `${WRIKE_API_BASE}/folders`;
        }
        break;

      case 'tasks':
        if (folderId) {
          endpoint = `${WRIKE_API_BASE}/folders/${folderId}/tasks?fields=["description","briefDescription","parentIds","superParentIds","responsibleIds","dates","customFields","authorIds","hasAttachments","superTaskIds","subTaskIds"]`;
        } else {
          endpoint = `${WRIKE_API_BASE}/tasks?fields=["description","briefDescription","parentIds","superParentIds","responsibleIds","dates","customFields","authorIds","hasAttachments","superTaskIds","subTaskIds"]`;
        }
        break;

      case 'contacts':
        endpoint = `${WRIKE_API_BASE}/contacts`;
        break;

      case 'workflows':
        endpoint = `${WRIKE_API_BASE}/workflows`;
        break;

      case 'account':
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

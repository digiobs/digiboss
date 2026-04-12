import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getWrikeToken } from "../_shared/wrike-token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let WRIKE_TOKEN: string;
  let WRIKE_BASE: string;
  try {
    const bundle = await getWrikeToken();
    WRIKE_TOKEN = bundle.token;
    WRIKE_BASE = bundle.apiBase;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Wrike not connected';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, folderId, taskId, fields, status, useCache, taskData } = await req.json();

    let url = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      case 'getSubProjects':
        url = `${WRIKE_BASE}/folders/${folderId}/folders?project=true`;
        break;
      case 'getTasks':
        url = `${WRIKE_BASE}/folders/${folderId}/tasks?fields=[${(fields || ['customFields', 'effortAllocation']).map((f: string) => `"${f}"`).join(',')}]&pageSize=100`;
        break;
      case 'getAllTasks': {
        // Get tasks from a space with pagination
        let allTasks: unknown[] = [];
        let nextPageToken: string | undefined;
        const pageUrl = `${WRIKE_BASE}/folders/${folderId}/tasks?fields=[${(fields || ['customFields', 'effortAllocation']).map((f: string) => `"${f}"`).join(',')}]&pageSize=100`;
        
        do {
          const pageUrlWithToken = nextPageToken ? `${pageUrl}&nextPageToken=${nextPageToken}` : pageUrl;
          const resp = await fetch(pageUrlWithToken, {
            headers: { 'Authorization': `Bearer ${WRIKE_TOKEN}` },
          });
          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Wrike API error [${resp.status}]: ${errText}`);
          }
          const result = await resp.json();
          allTasks = allTasks.concat(result.data || []);
          nextPageToken = result.nextPageToken;
        } while (nextPageToken);

        return new Response(JSON.stringify({ data: allTasks }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      case 'updateTaskStatus':
        url = `${WRIKE_BASE}/tasks/${taskId}`;
        method = 'PUT';
        body = JSON.stringify({ customStatus: status });
        break;
      case 'getWorkflows':
        url = `${WRIKE_BASE}/workflows`;
        break;
      case 'getFolderTree':
        url = `${WRIKE_BASE}/folders/${folderId}/folders`;
        break;
      case 'getContacts':
        url = `${WRIKE_BASE}/contacts?pageSize=1000`;
        break;
      case 'createTask': {
        if (!folderId || !taskData) {
          return new Response(JSON.stringify({ error: 'folderId and taskData are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const createResp = await fetch(`${WRIKE_BASE}/folders/${folderId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WRIKE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });
        if (!createResp.ok) {
          const errText = await createResp.text();
          throw new Error(`Wrike API error [${createResp.status}]: ${errText}`);
        }
        const createResult = await createResp.json();
        return new Response(JSON.stringify(createResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      case 'listFolders': {
        // Flat list of spaces + their direct subfolders (used by the
        // "Liaison clients → Wrike" picker in /settings/integrations).
        // We avoid the bare /folders endpoint because it requires a scope
        // and fails with non-2xx when called at root. Instead we walk
        // /spaces then /folders/{spaceId}/folders per space.
        const spacesResp = await fetch(`${WRIKE_BASE}/spaces`, {
          headers: { 'Authorization': `Bearer ${WRIKE_TOKEN}` },
        });
        if (!spacesResp.ok) {
          const errText = await spacesResp.text();
          throw new Error(`Wrike API error [${spacesResp.status}] on /spaces: ${errText}`);
        }
        const spacesJson = await spacesResp.json() as { data?: Array<{ id: string; title: string }> };
        const spaces = spacesJson.data ?? [];

        type PickerFolder = {
          id: string;
          title: string;
          scope: string;
          project?: { status?: string } | null;
        };
        const allFolders: PickerFolder[] = [];

        for (const space of spaces) {
          // The space itself is a valid target (its id is usable as folderId
          // for POST /folders/{id}/tasks).
          allFolders.push({
            id: space.id,
            title: space.title,
            scope: 'WsRoot',
            project: null,
          });

          try {
            const subResp = await fetch(
              `${WRIKE_BASE}/folders/${space.id}/folders?fields=["project"]`,
              { headers: { 'Authorization': `Bearer ${WRIKE_TOKEN}` } },
            );
            if (!subResp.ok) continue;
            const subJson = await subResp.json() as {
              data?: Array<{
                id: string;
                title: string;
                scope?: string;
                project?: { status?: string } | null;
              }>;
            };
            for (const f of subJson.data ?? []) {
              allFolders.push({
                id: f.id,
                title: `${space.title} / ${f.title}`,
                scope: f.scope ?? 'WsFolder',
                project: f.project ?? null,
              });
            }
          } catch (err) {
            console.warn(`[wrike-proxy] listFolders: failed to fetch folders for space ${space.id}:`, err);
          }
        }

        return new Response(JSON.stringify({ data: allFolders }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Check cache for GET requests
    if (method === 'GET' && useCache !== false) {
      const cached = getCached(url);
      if (cached) {
        return new Response(JSON.stringify({ data: (cached as Record<string, unknown>).data || cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const wrikeResp = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${WRIKE_TOKEN}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body } : {}),
    });

    if (!wrikeResp.ok) {
      const errText = await wrikeResp.text();
      throw new Error(`Wrike API error [${wrikeResp.status}]: ${errText}`);
    }

    const result = await wrikeResp.json();

    // Cache GET responses
    if (method === 'GET') {
      setCache(url, result);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Wrike proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
    // Return 200 so supabase.functions.invoke() surfaces the error body.
    return new Response(JSON.stringify({ data: [], error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, folderId, taskId, fields, status, useCache } = await req.json();

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
      case 'listFolders': {
        // Flat list of spaces + their direct subfolders (used by the
        // "Liaison clients → Wrike" picker in /settings/integrations).
        // Always returns HTTP 200 so the frontend (which uses
        // supabase.functions.invoke) can surface the real Wrike error in
        // `data.error` — 500s get swallowed as "non-2xx" by the client.
        type PickerFolder = {
          id: string;
          title: string;
          scope: string;
          project?: { status?: string } | null;
        };
        const allFolders: PickerFolder[] = [];
        const diagnostics: string[] = [];

        try {
          const spacesResp = await fetch(`${WRIKE_BASE}/spaces`, {
            headers: { 'Authorization': `Bearer ${WRIKE_TOKEN}` },
          });
          if (!spacesResp.ok) {
            const errText = await spacesResp.text();
            return new Response(
              JSON.stringify({
                data: [],
                error: `Wrike /spaces returned ${spacesResp.status}: ${errText.slice(0, 400)}`,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
          const spacesJson = await spacesResp.json() as {
            data?: Array<{ id: string; title: string }>;
          };
          const spaces = spacesJson.data ?? [];
          diagnostics.push(`spaces=${spaces.length}`);

          for (const space of spaces) {
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
              if (!subResp.ok) {
                const errText = await subResp.text();
                diagnostics.push(
                  `sub(${space.id})=${subResp.status}:${errText.slice(0, 80)}`,
                );
                continue;
              }
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
              const message = err instanceof Error ? err.message : String(err);
              diagnostics.push(`sub(${space.id})=throw:${message.slice(0, 80)}`);
            }
          }

          return new Response(
            JSON.stringify({ data: allFolders, diagnostics }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[wrike-proxy] listFolders crashed:', err);
          return new Response(
            JSON.stringify({
              data: [],
              error: `listFolders crashed: ${message}`,
              diagnostics,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
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

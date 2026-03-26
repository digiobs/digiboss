import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MappingRow = {
  client_id: string;
  external_account_id: string | null;
  external_account_name: string | null;
};

type ClientRow = {
  id: string;
  name: string;
};

type FigmaNode = {
  id?: string;
  name?: string;
  type?: string;
};

type FigmaProject = {
  id: string;
  name: string;
};

type FigmaProjectFile = {
  key: string;
  name: string;
  thumbnail_url?: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreCandidate(clientName: string, text: string): number {
  const a = normalizeText(clientName);
  const b = normalizeText(text);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a)) return 0.95;

  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let overlap = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) overlap += 1;
  });
  return overlap / Math.max(aTokens.size, bTokens.size);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedClientId: string | null = body?.clientId ?? null;
    const refresh = body?.refresh === true;
    const autoMap = body?.autoMap === true;

    const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIGMA_ACCESS_TOKEN) throw new Error("Missing FIGMA_ACCESS_TOKEN secret");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase runtime secrets");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("id,name")
      .order("name");
    if (clientsError) {
      throw new Error(`Failed to read clients: ${clientsError.message}`);
    }
    const allClients = (clientsData ?? []) as ClientRow[];
    const targetClients = requestedClientId
      ? allClients.filter((c) => c.id === requestedClientId)
      : allClients;

    if (targetClients.length === 0) {
      return new Response(
        JSON.stringify({ projects: [], folders: [], syncStates: [], message: "No clients found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetIds = new Set(targetClients.map((c) => c.id));

    if (autoMap) {
      const teamId: string | null = (body?.teamId as string | undefined) ?? Deno.env.get("FIGMA_TEAM_ID") ?? null;
      if (teamId) {
        const projectsResp = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
          headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN },
        });
        if (projectsResp.ok) {
          const projectsJson = await projectsResp.json();
          const teamProjects = ((projectsJson?.projects ?? []) as FigmaProject[]).slice(0, 100);

          const candidates: Array<{
            file_key: string;
            file_name: string;
            project_name: string;
            thumbnail_url: string | null;
          }> = [];

          for (const project of teamProjects) {
            const filesResp = await fetch(`https://api.figma.com/v1/projects/${project.id}/files`, {
              headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN },
            });
            if (!filesResp.ok) continue;
            const filesJson = await filesResp.json();
            const files = (filesJson?.files ?? []) as FigmaProjectFile[];
            files.forEach((file) => {
              if (!file?.key) return;
              candidates.push({
                file_key: file.key,
                file_name: file.name ?? "Untitled file",
                project_name: project.name ?? "Untitled project",
                thumbnail_url: file.thumbnail_url ?? null,
              });
            });
          }

          if (candidates.length > 0) {
            const { data: existingMappings } = await supabase
              .from("client_data_mappings")
              .select("client_id,provider,connector,status")
              .eq("provider", "figma")
              .eq("connector", "file");

            const alreadyConnected = new Set(
              ((existingMappings ?? []) as Array<Record<string, unknown>>)
                .filter((m) => String(m.status ?? "") === "connected")
                .map((m) => String(m.client_id ?? "")),
            );

            const toUpsert: Array<{
              client_id: string;
              provider: string;
              connector: string;
              external_account_id: string;
              external_account_name: string;
              status: string;
              notes: string;
            }> = [];

            for (const client of targetClients) {
              if (alreadyConnected.has(client.id)) continue;

              let best:
                | {
                    score: number;
                    file_key: string;
                    file_name: string;
                    project_name: string;
                  }
                | null = null;
              for (const candidate of candidates) {
                const text = `${candidate.project_name} ${candidate.file_name}`;
                const score = scoreCandidate(client.name, text);
                if (!best || score > best.score) {
                  best = {
                    score,
                    file_key: candidate.file_key,
                    file_name: candidate.file_name,
                    project_name: candidate.project_name,
                  };
                }
              }

              if (best && best.score >= 0.4) {
                toUpsert.push({
                  client_id: client.id,
                  provider: "figma",
                  connector: "file",
                  external_account_id: best.file_key,
                  external_account_name: best.file_name,
                  status: "connected",
                  notes: `Auto-mapped from team ${teamId} (project: ${best.project_name}, score: ${best.score.toFixed(2)})`,
                });
              }
            }

            if (toUpsert.length > 0) {
              await supabase
                .from("client_data_mappings")
                .upsert(toUpsert, { onConflict: "client_id,provider,connector" });
            }
          }
        }
      }
    }

    if (!refresh) {
      let cacheQuery = supabase
        .from("client_figma_folders")
        .select("client_id,file_key,file_name,project_name,folder_id,folder_name,folder_type,thumbnail_url")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (requestedClientId) {
        cacheQuery = cacheQuery.eq("client_id", requestedClientId);
      }
      const { data: cachedFolders, error: cacheError } = await cacheQuery;
      if (!cacheError && (cachedFolders ?? []).length > 0) {
        let stateQuery = supabase
          .from("client_figma_sync_state")
          .select("client_id,status,folder_count,file_count,last_synced_at,message")
          .order("updated_at", { ascending: false });
        if (requestedClientId) {
          stateQuery = stateQuery.eq("client_id", requestedClientId);
        }
        const { data: syncStates } = await stateQuery;
        const projectsByFile = new Map<string, {
          client_id: string;
          file_key: string;
          file_name: string;
          project_name: string | null;
          thumbnail_url: string | null;
          folder_count: number;
        }>();
        for (const folder of (cachedFolders ?? []) as Array<Record<string, unknown>>) {
          const k = `${String(folder.client_id ?? "")}:${String(folder.file_key ?? "")}`;
          const existing = projectsByFile.get(k);
          if (existing) {
            existing.folder_count += 1;
          } else {
            projectsByFile.set(k, {
              client_id: String(folder.client_id ?? ""),
              file_key: String(folder.file_key ?? ""),
              file_name: String(folder.file_name ?? "Untitled file"),
              project_name: typeof folder.project_name === "string" ? folder.project_name : null,
              thumbnail_url: typeof folder.thumbnail_url === "string" ? folder.thumbnail_url : null,
              folder_count: 1,
            });
          }
        }

        return new Response(
          JSON.stringify({
            cached: true,
            projects: Array.from(projectsByFile.values()),
            folders: cachedFolders,
            syncStates: syncStates ?? [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let mappingsQuery = supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id,external_account_name")
      .eq("provider", "figma")
      .eq("status", "connected");

    if (requestedClientId) {
      mappingsQuery = mappingsQuery.eq("client_id", requestedClientId);
    }

    const { data: mappings, error: mappingsError } = await mappingsQuery;
    if (mappingsError) {
      throw new Error(`Failed to read figma mappings: ${mappingsError.message}`);
    }

    const usableMappings = ((mappings ?? []) as MappingRow[]).filter(
      (m) => targetIds.has(m.client_id) && (m.external_account_id ?? "").trim().length > 0,
    );

    const projects: Array<{
      client_id: string;
      file_key: string;
      file_name: string;
      project_name: string | null;
      thumbnail_url: string | null;
      folder_count: number;
    }> = [];

    const folders: Array<{
      client_id: string;
      file_key: string;
      file_name: string;
      folder_id: string;
      folder_name: string;
      folder_type: string;
      thumbnail_url: string | null;
      page_index: number;
      payload: Record<string, unknown>;
    }> = [];

    const mappedClientIds = new Set(usableMappings.map((m) => m.client_id));
    const syncStatesPayload: Array<{
      client_id: string;
      status: string;
      folder_count: number;
      file_count: number;
      last_synced_at: string;
      message: string;
    }> = [];

    for (const client of targetClients) {
      if (!mappedClientIds.has(client.id)) {
        syncStatesPayload.push({
          client_id: client.id,
          status: "no_mapping",
          folder_count: 0,
          file_count: 0,
          last_synced_at: new Date().toISOString(),
          message: "No connected Figma mapping",
        });
      }
    }

    for (const mapping of usableMappings) {
      const fileKey = (mapping.external_account_id ?? "").trim();
      if (!fileKey) continue;

      const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN },
      });

      if (!fileResponse.ok) {
        // Skip failing file and continue with others.
        continue;
      }

      const fileJson = await fileResponse.json();
      const fileName = (fileJson?.name as string | undefined) ?? mapping.external_account_name ?? fileKey;
      const topThumbnail = (fileJson?.thumbnailUrl as string | undefined) ?? null;
      const pages = ((fileJson?.document?.children ?? []) as FigmaNode[]).slice(0, 24);
      const ids = pages.map((p) => p.id).filter((id): id is string => Boolean(id));
      let imageMap: Record<string, string | null> = {};

      if (ids.length > 0) {
        const params = new URLSearchParams({
          ids: ids.join(","),
          format: "png",
          scale: "1",
        });
        const imageResponse = await fetch(`https://api.figma.com/v1/images/${fileKey}?${params.toString()}`, {
          headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN },
        });
        if (imageResponse.ok) {
          const imageJson = await imageResponse.json();
          imageMap = (imageJson?.images ?? {}) as Record<string, string | null>;
        }
      }

      projects.push({
        client_id: mapping.client_id,
        file_key: fileKey,
        file_name: fileName,
        project_name: null,
        thumbnail_url: topThumbnail,
        folder_count: pages.length,
      });

      await supabase
        .from("client_figma_folders")
        .delete()
        .eq("client_id", mapping.client_id)
        .eq("file_key", fileKey);

      pages.forEach((page, index) => {
        const pageId = page.id ?? crypto.randomUUID();
        folders.push({
          client_id: mapping.client_id,
          file_key: fileKey,
          file_name: fileName,
          folder_id: pageId,
          folder_name: page.name ?? "Untitled folder",
          folder_type: page.type ?? "PAGE",
          thumbnail_url: imageMap[pageId] ?? topThumbnail,
          page_index: index,
          payload: {
            page,
            imageUrl: imageMap[pageId] ?? null,
          },
        });
      });

      syncStatesPayload.push({
        client_id: mapping.client_id,
        status: "synced",
        folder_count: pages.length,
        file_count: 1,
        last_synced_at: new Date().toISOString(),
        message: `Synced from file ${fileName}`,
      });
    }

    if (folders.length > 0) {
      const { error: upsertFoldersError } = await supabase
        .from("client_figma_folders")
        .upsert(folders, { onConflict: "client_id,file_key,folder_id" });
      if (upsertFoldersError) {
        throw new Error(`Failed to cache folders: ${upsertFoldersError.message}`);
      }
    }

    if (syncStatesPayload.length > 0) {
      const { error: upsertSyncError } = await supabase
        .from("client_figma_sync_state")
        .upsert(syncStatesPayload, { onConflict: "client_id" });
      if (upsertSyncError) {
        throw new Error(`Failed to update sync states: ${upsertSyncError.message}`);
      }
    }

    let syncQuery = supabase
      .from("client_figma_sync_state")
      .select("client_id,status,folder_count,file_count,last_synced_at,message")
      .order("updated_at", { ascending: false });
    if (requestedClientId) {
      syncQuery = syncQuery.eq("client_id", requestedClientId);
    }
    const { data: syncStates } = await syncQuery;

    return new Response(
      JSON.stringify({
        projects,
        folders,
        syncStates: syncStates ?? [],
        autoMapApplied: autoMap,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

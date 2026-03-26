import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import { callClaudeJson } from "../_shared/claude.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MeetingRow = {
  id: string;
  client_id: string | null;
  meeting_url: string | null;
  raw: Record<string, unknown> | null;
};

type TranscriptSegment = {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  startTime: number;
  endTime: number;
};

type StoredHighlight = {
  id: string;
  title: string;
  timestamp: number;
  type: "decision" | "action" | "problem" | "opportunity" | "key_moment";
};

type StoredAiSummary = {
  decisions: string[];
  problems: string[];
  opportunities: string[];
  actionItems: Array<{ action: string; owner?: string; dueDate?: string }>;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function extractSegmentCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asObject(payload);
  if (!root) return [];

  const candidates = [
    root["segments"],
    root["transcriptSegments"],
    root["transcript"],
    root["utterances"],
    root["data"],
    asObject(root["data"])?.["segments"],
    asObject(root["data"])?.["transcriptSegments"],
    asObject(root["data"])?.["transcript"],
    asObject(root["data"])?.["data"],
    asObject(root["meeting"])?.["segments"],
    asObject(root["meeting"])?.["transcript"],
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function extractHighlightsCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asObject(payload);
  if (!root) return [];
  const candidates = [
    root["data"],
    root["highlights"],
    asObject(root["data"])?.["highlights"],
    asObject(root["meeting"])?.["highlights"],
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeSegments(rawSegments: unknown[], fallbackMeetingId: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  rawSegments.forEach((item, idx) => {
    const row = asObject(item);
    if (!row) return;

    const text =
      (typeof row["text"] === "string" ? row["text"] : null) ??
      (typeof row["content"] === "string" ? row["content"] : null) ??
      (typeof row["utterance"] === "string" ? row["utterance"] : null);
    if (!text || text.trim().length === 0) return;

    const speakerName =
      (typeof row["speakerName"] === "string" ? row["speakerName"] : null) ??
      (typeof row["speaker"] === "string" ? row["speaker"] : null) ??
      (typeof asObject(row["speaker"])?.["name"] === "string"
        ? (asObject(row["speaker"])?.["name"] as string)
        : null) ??
      "Speaker";

    const startTime = toNumber(
      row["startTime"] ?? row["start"] ?? row["start_time"] ?? row["offset"] ?? row["timestamp"],
      idx * 15,
    );
    const endTime = toNumber(row["endTime"] ?? row["end"] ?? row["end_time"], startTime + 10);
    const speakerId =
      (typeof row["speakerId"] === "string" ? row["speakerId"] : null) ??
      (typeof asObject(row["speaker"])?.["id"] === "string"
        ? (asObject(row["speaker"])?.["id"] as string)
        : null) ??
      `${fallbackMeetingId}-speaker-${idx + 1}`;

    segments.push({
      id: `${fallbackMeetingId}-segment-${idx + 1}`,
      speakerId,
      speakerName,
      text: text.trim(),
      startTime,
      endTime: endTime > startTime ? endTime : startTime + 10,
    });
  });
  return segments;
}

function segmentsToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => `[${s.startTime}s] ${s.speakerName}: ${s.text}`).join("\n");
}

function fallbackSegmentsFromRaw(meeting: MeetingRow): TranscriptSegment[] {
  const raw = meeting.raw ?? {};
  const organizerObj = asObject(raw["organizer"]);
  const organizerName =
    (typeof organizerObj?.["name"] === "string" ? (organizerObj["name"] as string) : null) ?? "Organizer";
  const invitees = asArray(raw["invitees"]);

  const rows: TranscriptSegment[] = [
    {
      id: `${meeting.id}-segment-fallback-1`,
      speakerId: `${meeting.id}-speaker-org`,
      speakerName: organizerName,
      text: "Transcript content not returned by tl;dv API. Meeting metadata imported successfully.",
      startTime: 0,
      endTime: 12,
    },
  ];
  invitees.slice(0, 6).forEach((invitee, idx) => {
    const inv = asObject(invitee);
    const name =
      (typeof inv?.["name"] === "string" ? (inv["name"] as string) : null) ??
      (typeof inv?.["email"] === "string" ? (inv["email"] as string) : null) ??
      `Participant ${idx + 1}`;
    rows.push({
      id: `${meeting.id}-segment-fallback-invitee-${idx + 1}`,
      speakerId: `${meeting.id}-speaker-invitee-${idx + 1}`,
      speakerName: name,
      text: `Participant detected in metadata: ${name}.`,
      startTime: 15 + idx * 8,
      endTime: 20 + idx * 8,
    });
  });
  return rows;
}

async function fetchJsonFromPaths(
  meetingId: string,
  token: string,
  paths: string[],
): Promise<{ payload: unknown | null; source: string | null; error: string | null }> {
  const bases = ["https://pasta.tldv.io/v1alpha1"];

  const errors: string[] = [];

  for (const base of bases) {
    for (const path of paths) {
      const response = await fetch(`${base}${path}`, {
        headers: { "x-api-key": token },
      });
      if (!response.ok) {
        errors.push(`${base}${path} -> ${response.status}`);
        continue;
      }
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        errors.push(`${base}${path} -> 200 (invalid JSON body)`);
        continue;
      }
      return { payload: json, source: `${base}${path}`, error: null };
    }
  }
  return {
    payload: null,
    source: null,
    error: errors.slice(0, 8).join(" | ") || "No endpoint succeeded",
  };
}

function inferHighlightType(text: string): StoredHighlight["type"] {
  const lower = text.toLowerCase();
  if (/(decid|approved|validation|validated)/.test(lower)) return "decision";
  if (/(action|todo|to do|next step|follow up|assign)/.test(lower)) return "action";
  if (/(problem|issue|blocker|risk|pain)/.test(lower)) return "problem";
  if (/(opportun|upside|growth|win)/.test(lower)) return "opportunity";
  return "key_moment";
}

function normalizeHighlights(rawHighlights: unknown[], meetingId: string): StoredHighlight[] {
  const highlights: StoredHighlight[] = [];
  rawHighlights.forEach((item, idx) => {
    const row = asObject(item);
    if (!row) return;
    const topic = asObject(row["topic"]);
    const text =
      (typeof row["text"] === "string" ? row["text"] : null) ??
      (typeof topic?.["title"] === "string" ? (topic["title"] as string) : null) ??
      (typeof topic?.["summary"] === "string" ? (topic["summary"] as string) : null);
    if (!text || !text.trim()) return;
    const timestamp = toNumber(row["startTime"] ?? row["timestamp"], idx * 15);
    highlights.push({
      id: `${meetingId}-highlight-${idx + 1}`,
      title: text.trim(),
      timestamp,
      type: inferHighlightType(text),
    });
  });
  return highlights;
}

function buildAiSummary(highlights: StoredHighlight[], segments: TranscriptSegment[]): StoredAiSummary {
  const decisions = highlights.filter((h) => h.type === "decision").map((h) => h.title);
  const problems = highlights.filter((h) => h.type === "problem").map((h) => h.title);
  const opportunities = highlights.filter((h) => h.type === "opportunity").map((h) => h.title);
  const actionItems = highlights
    .filter((h) => h.type === "action")
    .slice(0, 10)
    .map((h) => ({ action: h.title }));

  // Fallback: infer action items from transcript lines if highlights don't contain them.
  if (actionItems.length === 0) {
    const inferred = segments
      .filter((s) => /(next step|action|to do|todo|follow up|we should|i will|we will)/i.test(s.text))
      .slice(0, 8)
      .map((s) => ({ action: s.text }));
    actionItems.push(...inferred);
  }

  return {
    decisions: decisions.slice(0, 10),
    problems: problems.slice(0, 10),
    opportunities: opportunities.slice(0, 10),
    actionItems,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let runStartedAt = Date.now();
  let runSupabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = (body?.clientId as string | undefined) ?? null;
    const limit = Math.min(Math.max(Number(body?.limit ?? 50), 1), 200);
    const useClaudeSummary = Boolean(body?.useClaudeSummary ?? true);
    runStartedAt = Date.now();

    const TLDV_API_KEY = Deno.env.get("TLDV_API_KEY") ?? Deno.env.get("TLDV_ACCESS_TOKEN") ?? null;
    const supabase = createServiceClient();
    runSupabase = supabase;
    runId = await startIntegrationRun(supabase, {
      provider: "tldv",
      connector: "meetings",
      clientId,
      triggerType: "manual",
      requestPayload: { limit, hasApiKey: Boolean(TLDV_API_KEY), useClaudeSummary },
    });

    let query = supabase
      .from("tldv_meetings")
      .select("id,client_id,meeting_url,raw")
      .order("happened_at", { ascending: false })
      .limit(limit);
    if (clientId) query = query.eq("client_id", clientId);

    const { data: meetings, error: meetingsError } = await query;
    if (meetingsError) throw new Error(`Failed to read tldv_meetings: ${meetingsError.message}`);

    const rows = (meetings ?? []) as MeetingRow[];
    if (rows.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: 0,
          recordsUpserted: 0,
          recordsFailed: 0,
          durationMs: Date.now() - runStartedAt,
        },
      });
      return new Response(
        JSON.stringify({ synced: 0, enriched: 0, failed: 0, message: "No meetings found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let enriched = 0;
    let failed = 0;
    const diagnostics: Array<{ meetingId: string; error: string | null; source: string | null }> = [];
    const updates: Array<Record<string, unknown>> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const meeting = rows[index];
      let segments: TranscriptSegment[] = [];
      let status: "ready" | "failed" = "ready";
      let normalizedHighlights: StoredHighlight[] = [];
      let aiSummary: StoredAiSummary = {
        decisions: [],
        problems: [],
        opportunities: [],
        actionItems: [],
      };

      let transcriptSource: string | null = null;
      let transcriptError: string | null = null;
      if (TLDV_API_KEY) {
        const fetchedTranscript = await fetchJsonFromPaths(meeting.id, TLDV_API_KEY, [
          `/meetings/${meeting.id}/transcript`,
          `/meetings/${meeting.id}`,
        ]);
        transcriptSource = fetchedTranscript.source;
        transcriptError = fetchedTranscript.error;
        const candidates = extractSegmentCandidates(fetchedTranscript.payload);
        segments = normalizeSegments(candidates, meeting.id);

        const fetchedHighlights = await fetchJsonFromPaths(meeting.id, TLDV_API_KEY, [
          `/meetings/${meeting.id}/highlights`,
        ]);
        if (fetchedHighlights.payload) {
          const rawHighlights = extractHighlightsCandidates(fetchedHighlights.payload);
          normalizedHighlights = normalizeHighlights(rawHighlights, meeting.id);
        }
      }

      if (segments.length === 0) {
        segments = fallbackSegmentsFromRaw(meeting);
        status = TLDV_API_KEY ? "failed" : "ready";
      }

      const transcriptText = segmentsToText(segments);
      if (segments.length > 0) enriched += 1;
      if (status === "failed") failed += 1;
      aiSummary = buildAiSummary(normalizedHighlights, segments);
      if (useClaudeSummary && index < 10 && transcriptText.trim().length > 0) {
        try {
          const { data: claudeSummary } = await callClaudeJson<{
            decisions?: string[];
            problems?: string[];
            opportunities?: string[];
            actionItems?: Array<{ action?: string; owner?: string; dueDate?: string }>;
          }>({
            systemPrompt:
              "You summarize B2B marketing meetings. Return concise actionable JSON only.",
            userPrompt: `Meeting transcript:\n${transcriptText.slice(0, 9000)}\n\nReturn STRICT JSON:
{
  "decisions": ["string"],
  "problems": ["string"],
  "opportunities": ["string"],
  "actionItems": [{"action":"string","owner":"string","dueDate":"YYYY-MM-DD"}]
}`,
            maxTokens: 1400,
            temperature: 0.1,
          });

          aiSummary = {
            decisions: Array.isArray(claudeSummary?.decisions)
              ? claudeSummary.decisions.filter((x): x is string => typeof x === "string").slice(0, 10)
              : aiSummary.decisions,
            problems: Array.isArray(claudeSummary?.problems)
              ? claudeSummary.problems.filter((x): x is string => typeof x === "string").slice(0, 10)
              : aiSummary.problems,
            opportunities: Array.isArray(claudeSummary?.opportunities)
              ? claudeSummary.opportunities.filter((x): x is string => typeof x === "string").slice(0, 10)
              : aiSummary.opportunities,
            actionItems: Array.isArray(claudeSummary?.actionItems)
              ? claudeSummary.actionItems
                  .map((item) => ({
                    action: typeof item?.action === "string" ? item.action : "",
                    owner: typeof item?.owner === "string" ? item.owner : undefined,
                    dueDate: typeof item?.dueDate === "string" ? item.dueDate : undefined,
                  }))
                  .filter((item) => item.action.trim().length > 0)
                  .slice(0, 12)
              : aiSummary.actionItems,
          };
        } catch (claudeError) {
          console.error("Claude meeting summary failed:", claudeError);
        }
      }

      updates.push({
        id: meeting.id,
        transcript_segments: segments,
        transcript_text: transcriptText,
        transcript_status: status,
        highlights_json: normalizedHighlights,
        ai_summary_json: aiSummary,
        transcript_source: transcriptSource,
        transcript_error: transcriptError,
        transcript_synced_at: new Date().toISOString(),
      });
      diagnostics.push({
        meetingId: meeting.id,
        error: transcriptError,
        source: transcriptSource,
      });
    }

    if (updates.length > 0) {
      for (const update of updates) {
        const id = String(update.id ?? "");
        const { error: updateError } = await supabase
          .from("tldv_meetings")
          .update({
            transcript_segments: update.transcript_segments,
            transcript_text: update.transcript_text,
            transcript_status: update.transcript_status,
            highlights_json: update.highlights_json,
            ai_summary_json: update.ai_summary_json,
            transcript_source: update.transcript_source,
            transcript_error: update.transcript_error,
            transcript_synced_at: update.transcript_synced_at,
          })
          .eq("id", id);
        if (updateError) {
          throw new Error(`Failed to update transcripts: ${updateError.message}`);
        }
      }
    }

    await finishIntegrationRun(supabase, runId, {
      status: failed > 0 ? "partial" : "success",
      metrics: {
        recordsFetched: rows.length,
        recordsUpserted: updates.length,
        recordsFailed: failed,
        durationMs: Date.now() - runStartedAt,
      },
      samplePayload: diagnostics[0] ?? null,
    });

    return new Response(
      JSON.stringify({
        synced: rows.length,
        enriched,
        failed,
        usedApi: Boolean(TLDV_API_KEY),
        diagnostics: diagnostics.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (runSupabase) {
      await finishIntegrationRun(runSupabase, runId, {
        status: "failed",
        metrics: {
          durationMs: Date.now() - runStartedAt,
        },
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

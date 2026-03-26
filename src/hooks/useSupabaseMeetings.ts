import { useEffect, useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import type {
  Meeting,
  MeetingAISummary,
  MeetingHighlight,
  MeetingParticipant,
  TranscriptSegment,
  Verbatim,
} from "@/types/insights";
import { supabase } from "@/integrations/supabase/client";

type RawInvitee = {
  name?: string;
  email?: string;
};

type RawOrganizer = {
  name?: string;
  email?: string;
};

type TldvRow = {
  id: string;
  name: string | null;
  happened_at: string | null;
  duration_seconds: number | null;
  organizer_name: string | null;
  organizer_email: string | null;
  meeting_url: string | null;
  participants_count: number | null;
  raw: {
    invitees?: RawInvitee[];
    organizer?: RawOrganizer;
  } | null;
  client_id: string | null;
  transcript_text?: string | null;
  transcript_segments?: unknown[] | null;
  transcript_status?: string | null;
  ai_summary_json?: Record<string, unknown> | null;
  highlights_json?: unknown[] | null;
  thumbnail_url?: string | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function fallbackTranscript(row: TldvRow): TranscriptSegment[] {
  const organizer = row.organizer_name ?? row.raw?.organizer?.name ?? "Organizer";
  const baseText =
    `Meeting imported from tl;dv. Organizer: ${organizer}. ` +
    `Participants: ${row.participants_count ?? 0}.`;

  const segments: TranscriptSegment[] = [
    {
      id: `${row.id}-segment-1`,
      speakerId: `${row.id}-speaker-1`,
      speakerName: organizer,
      text: baseText,
      startTime: 0,
      endTime: Math.max(30, Math.round((row.duration_seconds ?? 1800) / 2)),
    },
  ];

  (row.raw?.invitees ?? []).slice(0, 8).forEach((invitee, idx) => {
    const label = invitee.name?.trim() || invitee.email?.trim();
    if (!label) return;
    segments.push({
      id: `${row.id}-segment-invitee-${idx + 1}`,
      speakerId: `${row.id}-speaker-invitee-${idx + 1}`,
      speakerName: label,
      text: `Participant listed in meeting metadata: ${label}`,
      startTime: 10 + idx * 10,
      endTime: 15 + idx * 10,
    });
  });

  return segments;
}

function normalizeStoredTranscriptSegments(row: TldvRow): TranscriptSegment[] {
  if (!Array.isArray(row.transcript_segments)) return [];
  const meetingId = row.id;
  return row.transcript_segments
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const segment = item as Record<string, unknown>;
      const text = typeof segment.text === "string" ? segment.text : "";
      if (!text.trim()) return null;
      const speakerName =
        typeof segment.speakerName === "string"
          ? segment.speakerName
          : typeof segment.speaker === "string"
            ? segment.speaker
            : "Speaker";
      const startTime =
        typeof segment.startTime === "number"
          ? segment.startTime
          : typeof segment.start === "number"
            ? segment.start
            : idx * 10;
      const endTime =
        typeof segment.endTime === "number"
          ? segment.endTime
          : typeof segment.end === "number"
            ? segment.end
            : startTime + 8;
      return {
        id: typeof segment.id === "string" ? segment.id : `${meetingId}-stored-segment-${idx + 1}`,
        speakerId:
          typeof segment.speakerId === "string"
            ? segment.speakerId
            : `${meetingId}-stored-speaker-${idx + 1}`,
        speakerName,
        text,
        startTime,
        endTime: endTime > startTime ? endTime : startTime + 8,
      } satisfies TranscriptSegment;
    })
    .filter((s): s is TranscriptSegment => Boolean(s));
}

function normalizeStoredHighlights(row: TldvRow): MeetingHighlight[] {
  if (!Array.isArray(row.highlights_json)) return [];
  return row.highlights_json
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const h = item as Record<string, unknown>;
      const title =
        (typeof h.title === "string" ? h.title : null) ??
        (typeof h.text === "string" ? h.text : null) ??
        (typeof h.label === "string" ? h.label : null);
      if (!title) return null;
      const timestamp =
        typeof h.timestamp === "number"
          ? h.timestamp
          : typeof h.startTime === "number"
            ? h.startTime
            : typeof h.time === "number"
              ? h.time
              : idx * 15;
      const rawType = typeof h.type === "string" ? h.type : "key_moment";
      const allowedTypes: MeetingHighlight["type"][] = ["decision", "action", "problem", "opportunity", "key_moment"];
      const type = allowedTypes.includes(rawType as MeetingHighlight["type"])
        ? (rawType as MeetingHighlight["type"])
        : "key_moment";
      return {
        id: typeof h.id === "string" ? h.id : `${row.id}-stored-highlight-${idx + 1}`,
        title,
        timestamp,
        type,
      } satisfies MeetingHighlight;
    })
    .filter((h): h is MeetingHighlight => Boolean(h));
}

function normalizeStoredAiSummary(row: TldvRow): MeetingAISummary | null {
  if (!row.ai_summary_json || typeof row.ai_summary_json !== "object") return null;
  const raw = row.ai_summary_json as Record<string, unknown>;
  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

  const actionItemsRaw = Array.isArray(raw.actionItems) ? raw.actionItems : [];
  const actionItems = actionItemsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      const action = typeof r.action === "string" ? r.action : typeof r.title === "string" ? r.title : null;
      if (!action) return null;
      return {
        action,
        owner: typeof r.owner === "string" ? r.owner : undefined,
        dueDate: typeof r.dueDate === "string" ? r.dueDate : undefined,
      };
    })
    .filter((x): x is { action: string; owner: string; dueDate: string } => Boolean(x) && typeof x.owner === 'string' && typeof x.dueDate === 'string');

  return {
    decisions: toStringArray(raw.decisions),
    problems: toStringArray(raw.problems),
    opportunities: toStringArray(raw.opportunities),
    actionItems,
  };
}

function buildParticipants(row: TldvRow): MeetingParticipant[] {
  const people: MeetingParticipant[] = [];

  const organizerName = row.organizer_name ?? row.raw?.organizer?.name ?? "Organizer";
  people.push({
    id: `${row.id}-org`,
    name: organizerName,
    role: "Organizer",
    company: "DigiObs",
  });

  (row.raw?.invitees ?? []).forEach((invitee, idx) => {
    const name = invitee.name?.trim() || invitee.email?.trim() || `Participant ${idx + 1}`;
    const email = invitee.email?.toLowerCase() ?? "";
    const company =
      email.includes("@") && email.split("@")[1]
        ? email.split("@")[1].replace(".com", "")
        : "External";

    people.push({
      id: `${row.id}-inv-${idx + 1}`,
      name,
      role: "Participant",
      company,
    });
  });

  return people;
}

function mapTldvRowToMeeting(row: TldvRow): Meeting {
  const storedTranscript = normalizeStoredTranscriptSegments(row);
  const transcript = storedTranscript.length > 0 ? storedTranscript : fallbackTranscript(row);
  const participants = buildParticipants(row);
  const verbatims: Verbatim[] = [];
  const durationSeconds = toNumber(row.duration_seconds);
  const fallbackHighlights: MeetingHighlight[] = [
    {
      id: `${row.id}-h-1`,
      title: `Organizer: ${row.organizer_name ?? row.raw?.organizer?.name ?? "Unknown"}`,
      timestamp: 0,
      type: "key_moment" as const,
    },
    {
      id: `${row.id}-h-2`,
      title: `${row.participants_count ?? (row.raw?.invitees?.length ?? 0)} participant(s)`,
      timestamp: 15,
      type: "key_moment" as const,
    },
  ];
  const highlights = normalizeStoredHighlights(row);
  const aiSummary = normalizeStoredAiSummary(row);

  return {
    id: row.id,
    title: row.name ?? "Untitled meeting",
    date: row.happened_at ?? new Date().toISOString(),
    duration: Math.max(1, Math.round(durationSeconds / 60)),
    videoUrl: row.meeting_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    transcriptStatus:
      row.transcript_status === "processing"
        ? "processing"
        : row.transcript_status === "failed"
          ? "failed"
          : "ready",
    participants,
    transcript,
    highlights: highlights.length > 0 ? highlights : fallbackHighlights,
    verbatims,
    aiSummary:
      aiSummary ??
      {
        decisions: row.meeting_url ? [`Recording available via tl;dv link.`] : [],
        problems: [],
        opportunities: (row.raw?.invitees?.length ?? 0) > 0 ? ["Participant metadata available."] : [],
        actionItems: [],
      },
    nbaCount: 0,
    tags: ["meeting", "tldv"],
    workflowTags: ["growth"],
  };
}


export function useSupabaseMeetings() {
  const { currentClient, isAllClientsSelected } = useClient();
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "none">("none");
  const [data, setData] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const projectUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (!mounted) return;
        setData([]);
        setSource("none");
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let query = (supabase as any)
          .from("tldv_meetings")
          .select(
            "id,name,happened_at,duration_seconds,organizer_name,organizer_email,meeting_url,participants_count,raw,client_id,transcript_text,transcript_segments,transcript_status,ai_summary_json,highlights_json,thumbnail_url",
          )
          .order("happened_at", { ascending: false })
          .limit(200);
        if (!isAllClientsSelected) {
          query = query.eq("client_id", currentClient.id);
        }
        const { data: assignedRows, error: queryError } = await query;

        if (queryError) {
          console.error("tldv_meetings query error:", queryError);
          if (!mounted) return;
          setData([]);
          setSource("none");
          setError(queryError.message ?? "Unknown meetings query error");
          setLoading(false);
          return;
        }

        const rows = ((assignedRows ?? []) as unknown) as TldvRow[];
        const mapped: Meeting[] = [];
        for (const row of rows) {
          try {
            mapped.push(mapTldvRowToMeeting(row));
          } catch (rowErr) {
            console.error("Failed to map meeting row:", row.id, rowErr);
          }
        }
        mapped.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        if (!mounted) return;
        setData(mapped);
        setSource(mapped.length > 0 ? "supabase" : "none");
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("useSupabaseMeetings unexpected error:", err);
        if (!mounted) return;
        setData([]);
        setSource("none");
        setError(err instanceof Error ? err.message : "Unexpected error loading meetings");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, isAllClientsSelected, refreshTick]);

  const refetch = () => setRefreshTick((v) => v + 1);
  return { loading, source, meetings: data, error, projectUrl, refetch };
}


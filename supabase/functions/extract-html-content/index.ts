import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge function to read an HTML pipeline document from private Supabase Storage,
 * parse it, and extract draft content per proposal/calendar entry.
 *
 * Body: { storage_path: string, client_id: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storage_path, client_id } = await req.json();
    if (!storage_path || !client_id) {
      return new Response(
        JSON.stringify({ error: "storage_path and client_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Download the HTML file from private storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("deliverables")
      .download(storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || "no data"}`);
    }

    const htmlContent = await fileData.text();

    // 2. Parse HTML to extract draft sections
    // The HTML documents from the pipeline contain sections per proposal with
    // headings matching proposal titles and body content underneath.
    const drafts = parseHtmlDrafts(htmlContent);

    // 3. Fetch existing proposals for this client
    const { data: proposals, error: propError } = await supabase
      .from("creative_proposals")
      .select("id, title")
      .eq("client_id", client_id);

    if (propError) throw propError;

    // 4. Match and update proposals with draft content
    let updatedCount = 0;
    for (const proposal of proposals || []) {
      const draft = findBestMatch(proposal.title, drafts);
      if (draft) {
        const { error: updateError } = await supabase
          .from("creative_proposals")
          .update({ draft_content: draft.content })
          .eq("id", proposal.id);

        if (!updateError) updatedCount++;
      }
    }

    // 5. Also update editorial_calendar entries linked to proposals
    const { data: calEntries, error: calError } = await supabase
      .from("editorial_calendar")
      .select("id, title, source_proposal_id")
      .eq("client_id", client_id);

    let calUpdated = 0;
    if (!calError && calEntries) {
      for (const entry of calEntries) {
        const draft = findBestMatch(entry.title, drafts);
        if (draft) {
          const { error: updateError } = await supabase
            .from("editorial_calendar")
            .update({ draft_content: draft.content })
            .eq("id", entry.id);

          if (!updateError) calUpdated++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        htmlSize: htmlContent.length,
        draftsExtracted: drafts.length,
        proposalsUpdated: updatedCount,
        calendarUpdated: calUpdated,
        draftTitles: drafts.map((d) => d.title),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-html-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface DraftSection {
  title: string;
  content: string;
}

/**
 * Parse the HTML pipeline document and extract draft sections.
 * The documents typically have <h2> or <h3> headings with proposal titles,
 * followed by the draft content in <p>, <ul>, <div> blocks.
 */
function parseHtmlDrafts(html: string): DraftSection[] {
  const drafts: DraftSection[] = [];

  // Strategy 1: Split by heading tags (h2/h3) which delimit each proposal section
  const sectionRegex = /<h[23][^>]*>(.*?)<\/h[23]>([\s\S]*?)(?=<h[23][^>]*>|<\/body>|$)/gi;
  let match;

  while ((match = sectionRegex.exec(html)) !== null) {
    const rawTitle = match[1].replace(/<[^>]+>/g, "").trim();
    const rawContent = match[2];

    // Strip HTML tags but preserve line breaks and structure
    const content = rawContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<\/h[456][^>]*>/gi, "\n\n")
      .replace(/<h[456][^>]*>/gi, "\n### ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (rawTitle && content.length > 20) {
      drafts.push({ title: rawTitle, content });
    }
  }

  // Strategy 2: If no headings found, try <section> or <article> blocks
  if (drafts.length === 0) {
    const articleRegex = /<(?:section|article)[^>]*>[\s\S]*?<(?:h[1-6]|strong)[^>]*>(.*?)<\/(?:h[1-6]|strong)>([\s\S]*?)<\/(?:section|article)>/gi;
    while ((match = articleRegex.exec(html)) !== null) {
      const rawTitle = match[1].replace(/<[^>]+>/g, "").trim();
      const content = match[2]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (rawTitle && content.length > 20) {
        drafts.push({ title: rawTitle, content });
      }
    }
  }

  return drafts;
}

/**
 * Find the best matching draft for a proposal title using fuzzy matching.
 */
function findBestMatch(
  proposalTitle: string,
  drafts: DraftSection[]
): DraftSection | null {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const normalizedTitle = normalize(proposalTitle);

  // Exact substring match first
  for (const draft of drafts) {
    const normalizedDraft = normalize(draft.title);
    if (
      normalizedDraft.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedDraft)
    ) {
      return draft;
    }
  }

  // Word overlap match (>60% of words in common)
  const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch: DraftSection | null = null;
  let bestScore = 0;

  for (const draft of drafts) {
    const draftWords = normalize(draft.title)
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const overlap = titleWords.filter((w) => draftWords.includes(w)).length;
    const score = overlap / Math.max(titleWords.length, 1);
    if (score > bestScore && score > 0.4) {
      bestScore = score;
      bestMatch = draft;
    }
  }

  return bestMatch;
}

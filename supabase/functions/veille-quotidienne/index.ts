import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  startIntegrationRun,
  asArray,
  asObject,
} from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VeilleSignal {
  client_id: string;
  client_name: string;
  sector: string;
  title: string;
  summary: string;
  source: string;
  source_url: string | null;
  skill: string;
  severity: string;
  axis: string;
  action: string; // relay_social | insight | veille
  score: number;
  score_breakdown: Record<string, number> | null;
  is_actionable: boolean;
  suggested_angle: string | null;
  citations: string[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SKILLS = new Set([
  "veille", "market_intelligence", "seo", "ads", "social",
  "concurrence", "reputation", "compliance",
]);
const VALID_SEVERITIES = new Set(["alert", "warning", "opportunity", "info"]);
const VALID_ACTIONS = new Set(["relay_social", "insight", "veille"]);
const SCORE_THRESHOLD = 40;

function safeStr(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeSignal(raw: unknown): VeilleSignal | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const title = safeStr(obj.title);
  const summary = safeStr(obj.summary);
  const clientId = safeStr(obj.client_id);
  if (!title || !summary || !clientId) return null;

  const score = typeof obj.score === "number" ? obj.score : 0;
  if (score < SCORE_THRESHOLD) return null;

  const rawSkill = safeStr(obj.skill) ?? "";
  const rawSeverity = safeStr(obj.severity) ?? "";
  const rawAction = safeStr(obj.action) ?? "";

  return {
    client_id: clientId,
    client_name: safeStr(obj.client_name) ?? clientId,
    sector: safeStr(obj.sector) ?? "Autre",
    title,
    summary,
    source: safeStr(obj.source) ?? "Perplexity AI",
    source_url: safeStr(obj.source_url) ?? null,
    skill: VALID_SKILLS.has(rawSkill) ? rawSkill : "veille",
    severity: VALID_SEVERITIES.has(rawSeverity) ? rawSeverity : "info",
    axis: safeStr(obj.axis) ?? "Actualite secteur",
    action: VALID_ACTIONS.has(rawAction) ? rawAction : "veille",
    score,
    score_breakdown: asObject(obj.score_breakdown) as Record<string, number> | null,
    is_actionable: typeof obj.is_actionable === "boolean" ? obj.is_actionable : score >= 60,
    suggested_angle: safeStr(obj.suggested_angle) ?? null,
    citations: asArray(obj.citations).filter((c): c is string => typeof c === "string"),
  };
}

// ---------------------------------------------------------------------------
// Persist veille_items (delete-then-insert per client, like market-news)
// ---------------------------------------------------------------------------

async function upsertVeilleItems(
  supabase: ReturnType<typeof createServiceClient>,
  signals: VeilleSignal[],
): Promise<number> {
  if (signals.length === 0) return 0;

  // Group by client_id to delete previous daily batch per client
  const byClient = new Map<string, VeilleSignal[]>();
  for (const s of signals) {
    const arr = byClient.get(s.client_id) ?? [];
    arr.push(s);
    byClient.set(s.client_id, arr);
  }

  let total = 0;
  for (const [clientId, clientSignals] of byClient) {
    // Remove previous veille-quotidienne items for this client
    await supabase
      .from("veille_items")
      .delete()
      .eq("client_id", clientId)
      .eq("details->>source_function", "veille-quotidienne");

    const rows = clientSignals.map((s) => ({
      client_id: s.client_id,
      title: s.title,
      summary: s.summary,
      skill: s.skill,
      source: s.source,
      source_url: s.source_url,
      severity: s.severity,
      is_actionable: s.is_actionable,
      details: {
        source_function: "veille-quotidienne",
        sector: s.sector,
        axis: s.axis,
        action: s.action,
        score: s.score,
        score_breakdown: s.score_breakdown,
        suggested_angle: s.suggested_angle,
        citations: s.citations,
      },
    }));

    const { error } = await supabase.from("veille_items").insert(rows);
    if (error) {
      console.error(`Failed to insert veille_items for ${clientId}:`, error);
    } else {
      total += rows.length;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Create creative_proposals from high-score signals
// ---------------------------------------------------------------------------

async function createProposals(
  supabase: ReturnType<typeof createServiceClient>,
  signals: VeilleSignal[],
): Promise<number> {
  const proposals: Record<string, unknown>[] = [];

  for (const s of signals) {
    // Rule 1: score >= 60 AND action relay_social → content-post
    if (s.score >= 60 && s.action === "relay_social") {
      proposals.push({
        client_id: s.client_id,
        title: s.title,
        description: s.summary,
        rationale: s.suggested_angle ?? `Signal veille score ${s.score}% — relai social recommande`,
        source_skill: "veille-sectorielle",
        proposal_type: "content-post",
        target_skill: "social",
        urgency: s.score >= 80 ? "Critique" : "Urgente",
        status: "new",
        source_url: s.source_url,
        source_insight: `Score veille: ${s.score}% | Axe: ${s.axis}`,
        tags: ["veille-routing", s.sector.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
        metadata: {
          score_veille: s.score,
          skill_source: "veille-quotidienne",
          axis: s.axis,
          sector: s.sector,
        },
      });
    }

    // Rule 2: score >= 70 AND action insight → content-article + lead-magnet
    if (s.score >= 70 && s.action === "insight") {
      const base = {
        client_id: s.client_id,
        title: s.title,
        description: s.summary,
        rationale: s.suggested_angle ?? `Signal veille score ${s.score}% — insight approfondi`,
        source_skill: "veille-sectorielle",
        target_skill: "contenu",
        urgency: "Urgente",
        status: "new",
        source_url: s.source_url,
        source_insight: `Score veille: ${s.score}% | Axe: ${s.axis}`,
        tags: ["veille-routing", s.sector.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
        metadata: {
          score_veille: s.score,
          skill_source: "veille-quotidienne",
          axis: s.axis,
          sector: s.sector,
        },
      };

      proposals.push({ ...base, proposal_type: "content-article" });
      proposals.push({ ...base, proposal_type: "lead-magnet" });
    }
  }

  if (proposals.length === 0) return 0;

  const { error } = await supabase.from("creative_proposals").insert(proposals);
  if (error) {
    console.error("Failed to insert creative_proposals:", error);
    return 0;
  }
  return proposals.length;
}

// ---------------------------------------------------------------------------
// Generate HTML report
// ---------------------------------------------------------------------------

function generateHtmlReport(signals: VeilleSignal[], today: string): string {
  const sectors = [...new Set(signals.map((s) => s.sector))].sort();
  const clients = [...new Set(signals.map((s) => s.client_name))].sort();
  const avgScore = signals.length > 0
    ? Math.round(signals.reduce((sum, s) => sum + s.score, 0) / signals.length)
    : 0;
  const top3 = [...signals].sort((a, b) => b.score - a.score).slice(0, 3);

  const signalsJson = JSON.stringify(
    signals.map((s) => ({
      client: s.client_name,
      sector: s.sector,
      title: s.title,
      summary: s.summary,
      source: s.source,
      sourceUrl: s.source_url,
      axis: s.axis,
      action: s.action,
      score: s.score,
      severity: s.severity,
      angle: s.suggested_angle,
      citations: s.citations,
    })),
  );

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Veille DigiObs — ${today}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa;color:#1a1a2e;line-height:1.5;padding:20px}
.container{max-width:1200px;margin:0 auto}
header{background:#fff;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid #e2e8f0}
h1{font-size:1.5rem;color:#1a73e8}
.meta{color:#64748b;font-size:.85rem;margin-top:4px}
.counters{display:flex;gap:16px;margin-top:12px;flex-wrap:wrap}
.counter{background:#f1f5f9;padding:8px 16px;border-radius:8px;font-size:.85rem}
.counter strong{color:#1a73e8;font-size:1.2rem}
.filters{background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #e2e8f0;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.filters select,.filters input{padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:.85rem}
.filters input{flex:1;min-width:200px}
.summary{background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0}
.summary h2{font-size:1.1rem;margin-bottom:12px;color:#334155}
.top3{display:grid;gap:10px}
.top3-item{display:flex;gap:12px;align-items:center;padding:10px;background:#f8fafc;border-radius:8px}
.top3-score{font-size:1.3rem;font-weight:700;min-width:60px;text-align:center}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:.8rem;text-transform:uppercase;color:#64748b;cursor:pointer;user-select:none}
th:hover{background:#e2e8f0}
td{padding:10px 12px;border-top:1px solid #f1f5f9;font-size:.85rem;vertical-align:top}
tr.detail-row td{background:#f8fafc;padding:12px 20px;font-size:.85rem}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
.badge-score-high{background:#dcfce7;color:#166534}
.badge-score-mid{background:#fef3c7;color:#92400e}
.badge-score-low{background:#fee2e2;color:#991b1b}
.badge-relay{background:#dbeafe;color:#1e40af}
.badge-insight{background:#ede9fe;color:#5b21b6}
.badge-veille{background:#f1f5f9;color:#475569}
.badge-alert{background:#fee2e2;color:#991b1b}
.badge-warning{background:#fef3c7;color:#92400e}
.badge-opportunity{background:#dcfce7;color:#166534}
.badge-info{background:#dbeafe;color:#1e40af}
a{color:#1a73e8;text-decoration:none}
a:hover{text-decoration:underline}
.expand-btn{cursor:pointer;color:#1a73e8;font-size:.8rem}
@media print{body{background:#fff;padding:0}.filters{display:none}}
@media(max-width:768px){.filters{flex-direction:column}.counters{flex-direction:column}}
</style>
</head>
<body>
<div class="container">
<header>
  <h1>Veille Sectorielle DigiObs</h1>
  <div class="meta">${today} &mdash; Rapport automatique</div>
  <div class="counters">
    <div class="counter"><strong>${signals.length}</strong> signaux</div>
    <div class="counter"><strong>${clients.length}</strong> clients</div>
    <div class="counter"><strong>${sectors.length}</strong> secteurs</div>
    <div class="counter"><strong>${avgScore}%</strong> score moyen</div>
  </div>
</header>

<div class="summary">
  <h2>Top 3 signaux du jour</h2>
  <div class="top3">
    ${top3.map((s) => `<div class="top3-item"><span class="top3-score ${s.score >= 70 ? "badge-score-high" : s.score >= 50 ? "badge-score-mid" : "badge-score-low"}" style="border-radius:8px;padding:6px 12px">${s.score}%</span><div><strong>${esc(s.title)}</strong><br/><span style="color:#64748b;font-size:.8rem">${esc(s.client_name)} &middot; ${esc(s.sector)}</span></div></div>`).join("\n    ")}
  </div>
</div>

<div class="filters">
  <select id="f-sector"><option value="">Tous secteurs</option>${sectors.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
  <select id="f-client"><option value="">Tous clients</option>${clients.map((c) => `<option>${esc(c)}</option>`).join("")}</select>
  <select id="f-score"><option value="0">Score min</option><option value="40">40+</option><option value="50">50+</option><option value="60">60+</option><option value="70">70+</option><option value="80">80+</option></select>
  <select id="f-axis"><option value="">Tous axes</option><option>Actualite secteur</option><option>Mouvement concurrent</option><option>Tendance &amp; debat</option><option>Reglementaire</option><option>Evenement</option></select>
  <select id="f-action"><option value="">Toutes actions</option><option value="relay_social">Relai social</option><option value="insight">Insight</option><option value="veille">Veille</option></select>
  <input id="f-search" placeholder="Rechercher..."/>
</div>

<table>
<thead><tr>
  <th data-sort="score">Score</th>
  <th data-sort="client">Client</th>
  <th data-sort="title">Signal</th>
  <th data-sort="axis">Axe</th>
  <th data-sort="action">Action</th>
  <th data-sort="source">Source</th>
</tr></thead>
<tbody id="tbl"></tbody>
</table>
</div>

<script>
const DATA=${signalsJson};
const tbl=document.getElementById("tbl");
const fSector=document.getElementById("f-sector");
const fClient=document.getElementById("f-client");
const fScore=document.getElementById("f-score");
const fAxis=document.getElementById("f-axis");
const fAction=document.getElementById("f-action");
const fSearch=document.getElementById("f-search");
let sortKey="score",sortAsc=false,expanded=null;

function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML}
function badgeScore(s){return s>=70?"badge-score-high":s>=50?"badge-score-mid":"badge-score-low"}
function badgeAction(a){return a==="relay_social"?"badge-relay":a==="insight"?"badge-insight":"badge-veille"}
function labelAction(a){return a==="relay_social"?"Relai social":a==="insight"?"Insight":"Veille"}

function render(){
  const q=fSearch.value.toLowerCase();
  let items=DATA.filter(s=>{
    if(fSector.value&&s.sector!==fSector.value)return false;
    if(fClient.value&&s.client!==fClient.value)return false;
    if(+fScore.value&&s.score<+fScore.value)return false;
    if(fAxis.value&&s.axis!==fAxis.value)return false;
    if(fAction.value&&s.action!==fAction.value)return false;
    if(q&&!s.title.toLowerCase().includes(q)&&!s.summary.toLowerCase().includes(q)&&!s.client.toLowerCase().includes(q))return false;
    return true;
  });
  items.sort((a,b)=>{const va=a[sortKey],vb=b[sortKey];const c=typeof va==="number"?va-vb:String(va).localeCompare(String(vb));return sortAsc?c:-c});
  let html="";
  items.forEach((s,i)=>{
    html+='<tr data-idx="'+i+'" style="cursor:pointer">';
    html+='<td><span class="badge '+badgeScore(s.score)+'">'+s.score+'%</span></td>';
    html+='<td>'+esc(s.client)+'</td>';
    html+='<td><strong>'+esc(s.title)+'</strong></td>';
    html+='<td>'+esc(s.axis)+'</td>';
    html+='<td><span class="badge '+badgeAction(s.action)+'">'+labelAction(s.action)+'</span></td>';
    html+='<td>'+(s.sourceUrl?'<a href="'+esc(s.sourceUrl)+'" target="_blank">'+esc(s.source)+'</a>':esc(s.source))+'</td>';
    html+='</tr>';
    if(expanded===i){
      html+='<tr class="detail-row"><td colspan="6">';
      html+='<p>'+esc(s.summary)+'</p>';
      if(s.angle)html+='<p style="margin-top:8px"><strong>Angle suggere :</strong> '+esc(s.angle)+'</p>';
      if(s.citations&&s.citations.length)html+='<p style="margin-top:4px;font-size:.8rem;color:#64748b">Sources : '+s.citations.map(c=>'<a href="'+esc(c)+'" target="_blank">'+esc(c)+'</a>').join(", ")+'</p>';
      html+='</td></tr>';
    }
  });
  tbl.innerHTML=html;
}

tbl.addEventListener("click",e=>{const tr=e.target.closest("tr[data-idx]");if(!tr)return;const i=+tr.dataset.idx;expanded=expanded===i?null:i;render()});
document.querySelectorAll("th[data-sort]").forEach(th=>{th.addEventListener("click",()=>{const k=th.dataset.sort;if(sortKey===k)sortAsc=!sortAsc;else{sortKey=k;sortAsc=k!=="score"}render()})});
[fSector,fClient,fScore,fAxis,fAction].forEach(el=>el.addEventListener("change",render));
fSearch.addEventListener("input",render);
render();
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Store HTML report in Supabase Storage
// ---------------------------------------------------------------------------

async function storeReport(
  supabase: ReturnType<typeof createServiceClient>,
  html: string,
  today: string,
): Promise<string | null> {
  const filename = `veille-digiobs-${today}.html`;
  const path = `veille/reports/${today.slice(0, 4)}/${today.slice(0, 7)}/${filename}`;

  const { error } = await supabase.storage
    .from("deliverables")
    .upload(path, new Blob([html], { type: "text/html" }), {
      upsert: true,
      contentType: "text/html",
    });

  if (error) {
    console.error("Failed to store report:", error);
    return null;
  }

  // Register in deliverables table
  await supabase.from("deliverables").insert({
    type: "veille",
    title: `Veille sectorielle DigiObs — ${today}`,
    filename,
    skill_name: "veille-sectorielle",
    status: "ready",
    period: today.slice(0, 7),
    tags: ["veille-quotidienne", "multi-clients", "auto"],
  });

  return path;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const rawSignals = asArray(body?.signals);

    runId = await startIntegrationRun(supabase, {
      provider: "market-news",
      connector: "veille-quotidienne",
      triggerType: "manual",
      requestPayload: { signalCount: rawSignals.length },
    });

    // Normalize and filter signals (score >= 40)
    const signals = rawSignals
      .map(normalizeSignal)
      .filter((s): s is VeilleSignal => s !== null);

    if (signals.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: rawSignals.length,
          recordsUpserted: 0,
          recordsFailed: rawSignals.length,
          durationMs: Date.now() - startedAt,
        },
      });
      return new Response(
        JSON.stringify({ signals_inserted: 0, proposals_created: 0, report_url: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Persist veille items
    const signalsInserted = await upsertVeilleItems(supabase, signals);

    // 2. Create creative proposals from high-score signals
    const proposalsCreated = await createProposals(supabase, signals);

    // 3. Generate and store HTML report
    const today = new Date().toISOString().slice(0, 10);
    const html = generateHtmlReport(signals, today);
    const reportPath = await storeReport(supabase, html, today);

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: rawSignals.length,
        recordsUpserted: signalsInserted,
        recordsFailed: rawSignals.length - signals.length,
        durationMs: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({
        signals_inserted: signalsInserted,
        proposals_created: proposalsCreated,
        report_url: reportPath,
        signals_received: rawSignals.length,
        signals_qualified: signals.length,
        clients_covered: new Set(signals.map((s) => s.client_id)).size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("veille-quotidienne error:", error);
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

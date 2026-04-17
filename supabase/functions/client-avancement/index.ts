import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Default brand colors (Agro-Bio). Overridden by client_brand_kits if available.
const DEFAULT_COLORS = {
  primary: "#1a5632",
  primaryLight: "#2a7a4a",
};

type Task = {
  id: string;
  client_id: string;
  client_name: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  importance: string;
  assignee: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  resource_links: ResourceLink[];
  wrike_permalink: string | null;
  wrike_task_id: string | null;
  tags: string[];
  overdue_days: number;
  health_status: string;
  overdue_label: string | null;
};

type ResourceLink = {
  type: string;
  url: string;
  label: string;
};

type KPIs = {
  active_count: number;
  overdue_count: number;
  completed_count: number;
  deferred_count: number;
  total_count: number;
  completion_pct: number;
};

type TeamMember = {
  member: string;
  total_tasks: number;
  overdue_tasks: number;
  active_tasks: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "client_id parameter is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Support JSON output for API consumers
  const format = url.searchParams.get("format") || "html";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch all data in parallel
    const [tasksRes, kpisRes, teamRes, brandRes] = await Promise.all([
      supabase
        .from("v_client_avancement")
        .select("*")
        .eq("client_id", clientId),
      supabase.rpc("get_client_avancement_kpis", { p_client_id: clientId }),
      supabase.rpc("get_client_team_workload", { p_client_id: clientId }),
      supabase
        .from("client_brand_kits")
        .select("token_name, token_value")
        .eq("client_id", clientId)
        .eq("token_type", "color")
        .in("token_name", ["primary", "primary-light"]),
    ]);

    const tasks: Task[] = (tasksRes.data as Task[]) || [];
    let kpis: KPIs;
    let team: TeamMember[];

    // If RPC functions don't exist, compute from tasks
    if (kpisRes.error) {
      const overdue = tasks.filter((t) => t.health_status === "overdue");
      const onTrack = tasks.filter((t) => t.health_status === "on_track");
      const completed = tasks.filter((t) => t.health_status === "completed");
      const deferred = tasks.filter((t) => t.health_status === "deferred");
      kpis = {
        active_count: overdue.length + onTrack.length,
        overdue_count: overdue.length,
        completed_count: completed.length,
        deferred_count: deferred.length,
        total_count: tasks.length,
        completion_pct: tasks.length
          ? Math.round((100 * completed.length) / tasks.length)
          : 0,
      };
    } else {
      kpis = (Array.isArray(kpisRes.data) ? kpisRes.data[0] : kpisRes.data) as KPIs;
    }

    if (teamRes.error) {
      // Compute team workload from tasks
      const memberMap = new Map<
        string,
        { total: number; overdue: number; active: number }
      >();
      tasks
        .filter(
          (t) => t.status !== "completed" && t.status !== "cancelled" && t.assignee
        )
        .forEach((t) => {
          t.assignee!.split(", ").forEach((m) => {
            const entry = memberMap.get(m) || {
              total: 0,
              overdue: 0,
              active: 0,
            };
            entry.total++;
            if (t.health_status === "overdue") entry.overdue++;
            if (t.health_status === "on_track") entry.active++;
            memberMap.set(m, entry);
          });
        });
      team = Array.from(memberMap.entries())
        .map(([member, stats]) => ({
          member,
          total_tasks: stats.total,
          overdue_tasks: stats.overdue,
          active_tasks: stats.active,
        }))
        .sort(
          (a, b) =>
            b.overdue_tasks - a.overdue_tasks || b.total_tasks - a.total_tasks
        );
    } else {
      team = (teamRes.data as TeamMember[]) || [];
    }

    // Brand colors
    const brandColors = { ...DEFAULT_COLORS };
    if (brandRes.data && brandRes.data.length > 0) {
      for (const token of brandRes.data) {
        if (token.token_name === "primary") brandColors.primary = token.token_value;
        if (token.token_name === "primary-light")
          brandColors.primaryLight = token.token_value;
      }
    }

    if (format === "json") {
      return new Response(
        JSON.stringify({ tasks, kpis, team, brandColors }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientName =
      tasks.length > 0 ? tasks[0].client_name || clientId : clientId;
    const html = renderHTML(clientName, tasks, kpis, team, brandColors);

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("client-avancement error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ──

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function monthKey(d: string): string {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function resourceIcon(type: string): string {
  switch (type) {
    case "figma":
      return "🎨";
    case "gdocs":
    case "gdocs_en":
    case "gdocs_fr":
      return "📄";
    case "page":
      return "🌐";
    default:
      return "🔗";
  }
}

function renderResourceLinks(links: ResourceLink[]): string {
  if (!links || links.length === 0) return "";
  return `<div class="card-links">${links
    .map(
      (l) =>
        `<a href="${escapeHtml(l.url)}" target="_blank">${resourceIcon(l.type)} ${escapeHtml(l.label)}</a>`
    )
    .join("")}</div>`;
}

function renderTags(tags: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");
}

function renderTaskCard(task: Task): string {
  const cardClass = [
    "card",
    task.health_status === "overdue" ? "overdue" : "",
    task.importance === "High" ? "high" : "",
    task.health_status === "completed" ? "completed" : "",
    task.health_status === "deferred" ? "deferred" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const badgeClass =
    task.health_status === "overdue"
      ? "badge-overdue"
      : task.health_status === "completed"
        ? "badge-completed"
        : task.health_status === "deferred"
          ? "badge-deferred"
          : task.importance === "High"
            ? "badge-high"
            : "badge-active";

  const badgeLabel =
    task.health_status === "overdue"
      ? `En retard (${task.overdue_label})`
      : task.health_status === "completed"
        ? "Terminée"
        : task.health_status === "deferred"
          ? "Différée"
          : task.importance === "High"
            ? "Haute priorité"
            : "En cours";

  return `<div class="${cardClass}">
  <div class="card-header">
    <h3>${escapeHtml(task.title)}</h3>
    <span class="badge ${badgeClass}">${badgeLabel}</span>
  </div>
  ${task.description ? `<p class="card-desc">${escapeHtml(task.description)}</p>` : ""}
  <div class="card-meta">
    ${task.assignee ? `<span>👤 ${escapeHtml(task.assignee)}</span>` : ""}
    ${task.due_date ? `<span>📅 ${formatDate(task.due_date)}</span>` : ""}
    ${task.completed_at ? `<span>✅ ${formatDate(task.completed_at)}</span>` : ""}
  </div>
  <div class="card-footer">
    <div class="card-tags">${renderTags(task.tags)}</div>
    ${task.wrike_permalink ? `<a href="${escapeHtml(task.wrike_permalink)}" target="_blank" class="wrike-link">Voir dans Wrike →</a>` : ""}
  </div>
  ${renderResourceLinks(task.resource_links)}
</div>`;
}

function renderHTML(
  clientName: string,
  tasks: Task[],
  kpis: KPIs,
  team: TeamMember[],
  colors: { primary: string; primaryLight: string }
): string {
  const overdueTasks = tasks
    .filter((t) => t.health_status === "overdue")
    .sort((a, b) => b.overdue_days - a.overdue_days);
  const onTrackTasks = tasks.filter((t) => t.health_status === "on_track");
  const completedTasks = tasks.filter((t) => t.health_status === "completed");
  const deferredTasks = tasks.filter((t) => t.health_status === "deferred");

  // Group completed tasks by month
  const completedByMonth = new Map<string, Task[]>();
  completedTasks.forEach((t) => {
    const key = t.completed_at ? monthKey(t.completed_at) : "unknown";
    const arr = completedByMonth.get(key) || [];
    arr.push(t);
    completedByMonth.set(key, arr);
  });
  const sortedMonths = Array.from(completedByMonth.keys()).sort().reverse();

  const progressCompleted =
    kpis.total_count > 0
      ? ((kpis.completed_count / kpis.total_count) * 100).toFixed(1)
      : "0";
  const progressActive =
    kpis.total_count > 0
      ? (
          ((kpis.active_count - kpis.overdue_count) / kpis.total_count) *
          100
        ).toFixed(1)
      : "0";
  const progressOverdue =
    kpis.total_count > 0
      ? ((kpis.overdue_count / kpis.total_count) * 100).toFixed(1)
      : "0";
  const progressDeferred =
    kpis.total_count > 0
      ? ((kpis.deferred_count / kpis.total_count) * 100).toFixed(1)
      : "0";

  const now = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Avancement — ${escapeHtml(clientName)}</title>
<style>
:root {
  --primary: ${colors.primary};
  --primary-light: ${colors.primaryLight};
  --accent: #e8a838;
  --bg: #f7f8fa;
  --card: #ffffff;
  --text: #2d3748;
  --text-light: #718096;
  --border: #e2e8f0;
  --success: #38a169;
  --warning: #d69e2e;
  --danger: #e53e3e;
  --info: #3182ce;
  --deferred: #805ad5;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }

.header { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; padding: 2rem; text-align: center; }
.header h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
.header .subtitle { opacity: 0.85; font-size: 0.95rem; }

.container { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }

/* KPI Cards */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.kpi-card { background: var(--card); border-radius: 12px; padding: 1.2rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.kpi-number { font-size: 2rem; font-weight: 700; }
.kpi-label { font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.2rem; }
.kpi-card.overdue .kpi-number { color: var(--danger); }
.kpi-card.completed .kpi-number { color: var(--success); }
.kpi-card.deferred .kpi-number { color: var(--deferred); }
.kpi-card.active .kpi-number { color: var(--info); }

/* Progress Bar */
.progress-bar { height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; display: flex; margin-bottom: 2rem; }
.progress-fill { height: 100%; transition: width 0.5s ease; }
.progress-fill.completed { background: var(--success); }
.progress-fill.active { background: var(--info); }
.progress-fill.overdue { background: var(--danger); }
.progress-fill.deferred { background: var(--deferred); }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem; overflow-x: auto; }
.tab { padding: 0.7rem 1.2rem; cursor: pointer; border-bottom: 3px solid transparent; color: var(--text-light); font-weight: 500; font-size: 0.9rem; white-space: nowrap; background: none; border-top: none; border-left: none; border-right: none; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab .count { background: var(--border); border-radius: 10px; padding: 0.1rem 0.5rem; font-size: 0.75rem; margin-left: 0.3rem; }
.tab.active .count { background: var(--primary); color: white; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Task Cards */
.card { background: var(--card); border-radius: 10px; padding: 1.2rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border-left: 4px solid var(--info); }
.card.overdue { border-left-color: var(--danger); background: #fff5f5; }
.card.high { border-left-color: var(--warning); }
.card.completed { border-left-color: var(--success); opacity: 0.9; }
.card.deferred { border-left-color: var(--deferred); opacity: 0.85; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
.card-header h3 { font-size: 1rem; font-weight: 600; }
.card-desc { font-size: 0.88rem; color: var(--text-light); margin-bottom: 0.6rem; }
.card-meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem; color: var(--text-light); margin-bottom: 0.5rem; }
.card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.card-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.tag { background: #edf2f7; color: var(--text-light); border-radius: 4px; padding: 0.15rem 0.5rem; font-size: 0.72rem; }
.wrike-link { font-size: 0.82rem; color: var(--primary); text-decoration: none; font-weight: 500; }
.wrike-link:hover { text-decoration: underline; }

/* Resource Links */
.card-links { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid var(--border); }
.card-links a { display: inline-flex; align-items: center; gap: 0.3rem; background: #edf2f7; color: var(--text); text-decoration: none; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.78rem; transition: background 0.2s; }
.card-links a:hover { background: #e2e8f0; }

/* Badges */
.badge { font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 600; white-space: nowrap; }
.badge-active { background: #ebf8ff; color: var(--info); }
.badge-overdue { background: #fed7d7; color: var(--danger); }
.badge-completed { background: #c6f6d5; color: #276749; }
.badge-high { background: #fefcbf; color: #975a16; }
.badge-deferred { background: #e9d8fd; color: var(--deferred); }

/* Summary Grid */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.summary-box { background: var(--card); border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.summary-box h3 { font-size: 1rem; margin-bottom: 0.8rem; color: var(--primary); }
.summary-box ul { list-style: none; }
.summary-box li { padding: 0.3rem 0; font-size: 0.88rem; border-bottom: 1px solid var(--border); }
.summary-box li:last-child { border-bottom: none; }

/* Team Table */
.team-table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.team-table th { background: var(--primary); color: white; padding: 0.7rem 1rem; text-align: left; font-size: 0.85rem; font-weight: 600; }
.team-table td { padding: 0.6rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
.team-table tr:last-child td { border-bottom: none; }
.team-table .danger { color: var(--danger); font-weight: 600; }

/* Month header */
.month-header { font-size: 1rem; color: var(--primary); font-weight: 600; margin: 1.2rem 0 0.6rem; padding-bottom: 0.3rem; border-bottom: 2px solid var(--border); }

.footer { text-align: center; padding: 1.5rem; color: var(--text-light); font-size: 0.8rem; }

@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .card-header { flex-direction: column; }
  .tabs { gap: 0; }
  .tab { padding: 0.5rem 0.8rem; font-size: 0.82rem; }
}
</style>
</head>
<body>

<div class="header">
  <h1>Compte-rendu d'avancement</h1>
  <div class="subtitle">${escapeHtml(clientName)} — ${now}</div>
</div>

<div class="container">
  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card active">
      <div class="kpi-number">${kpis.active_count}</div>
      <div class="kpi-label">Tâches actives</div>
    </div>
    <div class="kpi-card overdue">
      <div class="kpi-number">${kpis.overdue_count}</div>
      <div class="kpi-label">En retard</div>
    </div>
    <div class="kpi-card completed">
      <div class="kpi-number">${kpis.completed_count}</div>
      <div class="kpi-label">Terminées</div>
    </div>
    <div class="kpi-card deferred">
      <div class="kpi-number">${kpis.deferred_count}</div>
      <div class="kpi-label">Différées</div>
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="progress-bar">
    <div class="progress-fill completed" style="width:${progressCompleted}%"></div>
    <div class="progress-fill active" style="width:${progressActive}%"></div>
    <div class="progress-fill overdue" style="width:${progressOverdue}%"></div>
    <div class="progress-fill deferred" style="width:${progressDeferred}%"></div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab active" onclick="showTab('overdue')">En retard <span class="count">${overdueTasks.length}</span></button>
    <button class="tab" onclick="showTab('ontrack')">En cours <span class="count">${onTrackTasks.length}</span></button>
    <button class="tab" onclick="showTab('completed')">Terminées <span class="count">${completedTasks.length}</span></button>
    <button class="tab" onclick="showTab('deferred')">Différées <span class="count">${deferredTasks.length}</span></button>
    <button class="tab" onclick="showTab('team')">Charge équipe <span class="count">${team.length}</span></button>
  </div>

  <!-- Tab: En retard -->
  <div id="tab-overdue" class="tab-panel active">
    ${overdueTasks.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:2rem;">Aucune tâche en retard 🎉</p>' : overdueTasks.map(renderTaskCard).join("")}
  </div>

  <!-- Tab: En cours -->
  <div id="tab-ontrack" class="tab-panel">
    ${onTrackTasks.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:2rem;">Aucune tâche en cours.</p>' : onTrackTasks.map(renderTaskCard).join("")}
  </div>

  <!-- Tab: Terminées -->
  <div id="tab-completed" class="tab-panel">
    ${completedTasks.length === 0
      ? '<p style="color:var(--text-light);text-align:center;padding:2rem;">Aucune tâche terminée.</p>'
      : sortedMonths
          .map(
            (mk) =>
              `<div class="month-header">${monthLabel(mk)}</div>${completedByMonth
                .get(mk)!
                .map(renderTaskCard)
                .join("")}`
          )
          .join("")}
  </div>

  <!-- Tab: Différées -->
  <div id="tab-deferred" class="tab-panel">
    ${deferredTasks.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:2rem;">Aucune tâche différée.</p>' : deferredTasks.map(renderTaskCard).join("")}
  </div>

  <!-- Tab: Charge équipe -->
  <div id="tab-team" class="tab-panel">
    ${
      team.length === 0
        ? '<p style="color:var(--text-light);text-align:center;padding:2rem;">Aucune donnée d\'équipe.</p>'
        : `<table class="team-table">
      <thead>
        <tr>
          <th>Membre</th>
          <th>Tâches actives</th>
          <th>En retard</th>
          <th>En cours</th>
        </tr>
      </thead>
      <tbody>
        ${team
          .map(
            (m) => `<tr>
          <td>${escapeHtml(m.member)}</td>
          <td>${m.total_tasks}</td>
          <td${m.overdue_tasks > 0 ? ' class="danger"' : ""}>${m.overdue_tasks}</td>
          <td>${m.active_tasks}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>`
    }
  </div>

  <!-- Summary Grid -->
  <div class="summary-grid" style="margin-top:2rem;">
    <div class="summary-box">
      <h3>⚠️ Alertes principales</h3>
      <ul>
        ${overdueTasks
          .slice(0, 5)
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.title)}</strong> — retard ${t.overdue_label || t.overdue_days + " jours"}</li>`
          )
          .join("") || "<li>Aucune alerte</li>"}
      </ul>
    </div>
    <div class="summary-box">
      <h3>✅ Dernières réalisations</h3>
      <ul>
        ${completedTasks
          .slice(0, 5)
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.title)}</strong> — ${formatDate(t.completed_at)}</li>`
          )
          .join("") || "<li>Aucune réalisation récente</li>"}
      </ul>
    </div>
  </div>
</div>

<div class="footer">
  Généré automatiquement par DigiObs — ${now}
</div>

<script>
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
}
</script>
</body>
</html>`;
}

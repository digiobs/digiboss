# DigiBoss

Multi-client marketing intelligence & operations platform built for DigiObs. Centralizes analytics, content production, competitive monitoring, and project management across all client accounts.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Realtime, Storage) |
| AI | Claude API (content generation, task suggestions, market news) |
| Hosting | Vercel (frontend), Supabase (edge functions) |
| CI | GitHub Actions (lint, typecheck, test, build, smoke) |

## Modules

### Dashboard & Home
KPI cards with trend analysis, weekly summary, next best actions, activity feed, editorial pipeline snapshot, signals panel, and data health monitoring.

### Plan & Tasks
Kanban board synchronized with Wrike. Task creation with typed workflows (SEO, content, campagne, etc.), team member assignment, period tracking, and client avancement progress.

### Proposals
Creative proposal management with Wrike integration. Workflow stages from idea to production, convergence detection between proposals, and monthly package grouping.

### Content
Content library with performance metrics (impressions, engagement, likes). Editorial calendar (Wrike-synced), content studio with AI generation, brief drawer, and recommendation engine.

### Veille (Market Intelligence)
Competitive monitoring and market news aggregation. Configurable per-client keywords and competitors. Daily automated veille via edge function with Claude-powered analysis.

### Reporting & Analytics
Multi-source analytics dashboard pulling from GA4, Google Search Console, SEMrush, Supermetrics, HubSpot, and LinkedIn. KPI strips, audience analysis, SEO section, paid/social breakdowns, and AI insights.

### SEO Geo
SEO positioning and geographic analysis with competitor market share tracking.

### Prospects
Lead pipeline with scoring (fit, intent, engagement). Lemlist campaign integration for outreach tracking and funnel metrics.

### Insights
Market news feed, AI-generated operational insights, meeting summaries from tl;dv transcripts, and next best action cards.

### Assets & Brand
Asset library with brand charte management. Figma integration for automated design token import (colors, typography, visual style). Static brand snapshots per client.

### Chat
AI-powered assistant (Claude) scoped to the current client context.

### Admin
- **Clients** -- Expandable cards showing industry, website, competitors, integration status (12 connectors), and client profile completeness. Full config dialog with all integration IDs.
- **Team** -- Member management (invite, roles, password reset) with per-user client access toggles.
- **Data** -- Connector mapping matrix (Supermetrics, GA4, HubSpot, LinkedIn, SEMrush, Lemlist, tl;dv, Wrike), integration health monitoring, Figma brand kit sync, RLS audit.

## Integrations (34 Edge Functions)

| Category | Functions |
|----------|-----------|
| **Wrike** | sync-wrike-tasks, wrike-create-task, wrike-create-proposal-task, wrike-update-proposal-status, wrike-auto-match, wrike-editorial-import, wrike-oauth-start/callback/disconnect, wrike-proxy |
| **Analytics** | google-search-console, semrush-sync, supermetrics-sync, onedrive-semrush-sync, reporting-sync |
| **CRM & Outreach** | hubspot-sync, lemlist-sync, lemlist-list-campaigns, linkedin-prospects-sync, fetch-linkedin-posts |
| **Design** | figma-brand-kit-import, figma-projects |
| **AI** | ai-suggest-tasks, generate-blog-content, generate-recommendations, market-news, veille-quotidienne |
| **Meetings** | tldv-sync-meetings, tldv-sync-transcripts |
| **System** | invite-team-member, client-avancement, dashboard-news, extract-html-content, index-deliverables |

## Database

**35 tables** including: clients, client_configs, client_profiles, client_brand_guidelines, client_data_mappings, plan_tasks, contents, content_metrics, deliverables, prospect_leads, veille_items, tldv_meetings, and more.

**13 views** including: v_client_full, v_content_studio_context, v_contents_with_metrics, v_dashboard_clients, v_deliverables_dashboard, v_integration_health, v_kpis_with_evolution, v_latest_channel_metrics.

Multi-tenancy enforced via RLS. Admins see all clients; team members see only assigned clients via `user_clients` junction table.

## Getting Started

```sh
git clone <repo-url>
cd digiboss
npm install
npm run dev
```

Requires a `.env` file with Supabase project URL and anon key.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run unit tests |
| `npm run ci` | Full CI pipeline (lint + typecheck + test + build + smoke) |
| `npm run smoke:functions` | Validate edge functions exist |
| `npm run brand:export` | Export Figma brand tokens to static JSON |

## Architecture

```
src/
  pages/          25 pages (Home, Plan, Proposals, Contents, Veille, Reporting, Admin, ...)
  components/     UI components organized by module (admin, plan, content, dashboard, ...)
  contexts/       ClientContext, TeamAuthContext, DateRangeContext, PreAuthContext
  hooks/          30+ custom hooks (usePlanTasks, useWrikeTasks, useContents, ...)
  data/           Mock/seed data files
  integrations/   Supabase client & generated types
  assets/brand/   Static brand charte JSON per client

supabase/
  functions/      34 edge functions + _shared utilities
  migrations/     38 migration files

docs/
  deliverables-routing.md     Skill routing & folder conventions
  architecture/               Ingestion contract, sync lifecycle
  security/                   Tenant isolation checklist
```

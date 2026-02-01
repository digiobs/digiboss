// Dashboard Data - Next Best Actions, Plan Items, Weekly Changes

export type ActionType = 'seo' | 'content' | 'paid' | 'social' | 'cro' | 'crm' | 'tech' | 'brand';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion';
export type Impact = 'high' | 'medium' | 'low';
export type Effort = 'S' | 'M' | 'L';
export type ChangeType = 'opportunity' | 'risk' | 'info';

export interface NextBestAction {
  id: string;
  title: string;
  type: ActionType;
  funnelStage: FunnelStage;
  impact: Impact;
  confidence: number;
  effort: Effort;
  whyNow: string[];
  evidenceLinks: { label: string; type: 'ga4' | 'gsc' | 'hubspot' | 'ads' | 'linkedin' }[];
  isContentRelated: boolean;
  urgencyScore: number;
  impactScore: number;
  effortScore: number;
}

export interface WeeklyChange {
  id: string;
  type: ChangeType;
  text: string;
  evidenceLabel: string;
  evidenceType: 'report' | 'insight' | 'campaign' | 'page';
}

export interface PlanItem {
  id: string;
  title: string;
  type: 'task' | 'content' | 'milestone' | 'meeting';
  channel?: string;
  owner?: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  relatedActionIds?: string[];
}

export interface DashboardKPI {
  id: string;
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  trend: 'up' | 'down' | 'neutral';
  sparklineData: number[];
  category: 'traffic' | 'leads' | 'seo' | 'paid' | 'engagement';
}

// Enhanced KPIs with sparkline data
export const dashboardKPIs: DashboardKPI[] = [
  {
    id: 'sessions',
    label: 'Sessions',
    value: '45.2K',
    delta: 12.5,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [35, 38, 42, 40, 45, 48, 52],
    category: 'traffic',
  },
  {
    id: 'new-users',
    label: 'New Users',
    value: '32.1K',
    delta: 8.3,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [24, 26, 28, 30, 29, 31, 34],
    category: 'traffic',
  },
  {
    id: 'conversions',
    label: 'Conversions',
    value: '234',
    delta: 15.2,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [180, 195, 210, 205, 220, 228, 234],
    category: 'leads',
  },
  {
    id: 'leads',
    label: 'Leads',
    value: '89',
    delta: 22.1,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [60, 65, 70, 72, 78, 82, 89],
    category: 'leads',
  },
  {
    id: 'seo-clicks',
    label: 'SEO Clicks',
    value: '18.4K',
    delta: 5.7,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [15, 16, 17, 16.5, 17.5, 18, 18.4],
    category: 'seo',
  },
  {
    id: 'impressions',
    label: 'Impressions',
    value: '892K',
    delta: 3.2,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [780, 800, 820, 850, 870, 880, 892],
    category: 'seo',
  },
  {
    id: 'spend',
    label: 'Ad Spend',
    value: '$8.4K',
    delta: -2.1,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [9.2, 8.9, 8.7, 8.5, 8.4, 8.4, 8.4],
    category: 'paid',
  },
  {
    id: 'ctr',
    label: 'CTR',
    value: '3.8%',
    delta: 0.4,
    deltaLabel: 'vs last week',
    trend: 'up',
    sparklineData: [3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8],
    category: 'paid',
  },
];

// Weekly changes with tags
export const weeklyChanges: WeeklyChange[] = [
  {
    id: '1',
    type: 'opportunity',
    text: 'LinkedIn Ads CPL dropped to $34 (target: $45) — reallocate budget to scale',
    evidenceLabel: 'LinkedIn Ads Report',
    evidenceType: 'report',
  },
  {
    id: '2',
    type: 'opportunity',
    text: 'New blog post ranked #4 for "B2B marketing automation" — optimize for #1',
    evidenceLabel: 'GSC Query Analysis',
    evidenceType: 'insight',
  },
  {
    id: '3',
    type: 'risk',
    text: 'Email open rates declining 22% → 18% — review subject lines and sender reputation',
    evidenceLabel: 'Email Performance',
    evidenceType: 'report',
  },
  {
    id: '4',
    type: 'info',
    text: '3 enterprise leads entered pipeline ($180K potential) from webinar campaign',
    evidenceLabel: 'HubSpot Pipeline',
    evidenceType: 'campaign',
  },
  {
    id: '5',
    type: 'risk',
    text: 'Google Ads CPA trending 15% above target — pause low performers',
    evidenceLabel: 'Google Ads Report',
    evidenceType: 'report',
  },
];

// Next Best Actions
export const nextBestActions: NextBestAction[] = [
  {
    id: 'nba-1',
    title: 'Improve meta titles for high-impression pages',
    type: 'seo',
    funnelStage: 'awareness',
    impact: 'high',
    confidence: 92,
    effort: 'S',
    whyNow: [
      '12 pages have 50K+ impressions but <2% CTR',
      'Quick win: avg CTR lift of 25% seen in similar optimizations',
    ],
    evidenceLinks: [
      { label: 'GSC Top Pages', type: 'gsc' },
      { label: 'Page Performance', type: 'ga4' },
    ],
    isContentRelated: true,
    urgencyScore: 85,
    impactScore: 90,
    effortScore: 95,
  },
  {
    id: 'nba-2',
    title: 'Launch LinkedIn retargeting for pricing visitors',
    type: 'paid',
    funnelStage: 'conversion',
    impact: 'high',
    confidence: 87,
    effort: 'M',
    whyNow: [
      '847 high-intent visitors in last 14 days',
      'Similar campaigns achieved 4.2% conversion rate',
    ],
    evidenceLinks: [
      { label: 'Pricing Page Traffic', type: 'ga4' },
      { label: 'LinkedIn Audience', type: 'linkedin' },
    ],
    isContentRelated: false,
    urgencyScore: 80,
    impactScore: 88,
    effortScore: 70,
  },
  {
    id: 'nba-3',
    title: 'A/B test pricing page headline',
    type: 'cro',
    funnelStage: 'conversion',
    impact: 'high',
    confidence: 78,
    effort: 'S',
    whyNow: [
      'Heatmap shows 67% don\'t scroll past fold',
      'Potential 15-20% conversion improvement',
    ],
    evidenceLinks: [
      { label: 'Heatmap Analysis', type: 'ga4' },
    ],
    isContentRelated: false,
    urgencyScore: 75,
    impactScore: 85,
    effortScore: 90,
  },
  {
    id: 'nba-4',
    title: 'Create comparison page vs. MarketForce',
    type: 'content',
    funnelStage: 'consideration',
    impact: 'high',
    confidence: 85,
    effort: 'M',
    whyNow: [
      'Competitor just launched AI feature — expect search volume spike',
      '2.4K monthly searches for "[competitor] alternatives"',
    ],
    evidenceLinks: [
      { label: 'Competitor Insight', type: 'gsc' },
      { label: 'Keyword Research', type: 'gsc' },
    ],
    isContentRelated: true,
    urgencyScore: 90,
    impactScore: 82,
    effortScore: 65,
  },
  {
    id: 'nba-5',
    title: 'Re-engage dormant email subscribers',
    type: 'crm',
    funnelStage: 'consideration',
    impact: 'medium',
    confidence: 71,
    effort: 'M',
    whyNow: [
      '2,340 subscribers inactive for 90+ days',
      'Win-back campaigns avg 8-12% reactivation',
    ],
    evidenceLinks: [
      { label: 'Email Segments', type: 'hubspot' },
    ],
    isContentRelated: true,
    urgencyScore: 60,
    impactScore: 65,
    effortScore: 70,
  },
  {
    id: 'nba-6',
    title: 'Pause underperforming Google Ads groups',
    type: 'paid',
    funnelStage: 'awareness',
    impact: 'medium',
    confidence: 95,
    effort: 'S',
    whyNow: [
      '3 ad groups with CPA 2.5x above target',
      'Wasted spend: $1,240 in last 7 days',
    ],
    evidenceLinks: [
      { label: 'Google Ads Report', type: 'ads' },
    ],
    isContentRelated: false,
    urgencyScore: 95,
    impactScore: 55,
    effortScore: 98,
  },
  {
    id: 'nba-7',
    title: 'Publish LinkedIn thought leadership post',
    type: 'social',
    funnelStage: 'awareness',
    impact: 'medium',
    confidence: 75,
    effort: 'S',
    whyNow: [
      'Last post reached 12K impressions — momentum to maintain',
      'Industry trend topic gaining traction',
    ],
    evidenceLinks: [
      { label: 'LinkedIn Analytics', type: 'linkedin' },
    ],
    isContentRelated: true,
    urgencyScore: 70,
    impactScore: 60,
    effortScore: 85,
  },
  {
    id: 'nba-8',
    title: 'Fix GA4 tracking on demo request form',
    type: 'tech',
    funnelStage: 'conversion',
    impact: 'high',
    confidence: 98,
    effort: 'S',
    whyNow: [
      'Tracking gap detected — 15% of conversions not recorded',
      'Impacts attribution and optimization decisions',
    ],
    evidenceLinks: [
      { label: 'GA4 Events', type: 'ga4' },
    ],
    isContentRelated: false,
    urgencyScore: 100,
    impactScore: 75,
    effortScore: 90,
  },
  {
    id: 'nba-9',
    title: 'Update brand assets for Q1 campaign',
    type: 'brand',
    funnelStage: 'awareness',
    impact: 'low',
    confidence: 80,
    effort: 'M',
    whyNow: [
      'New product feature launching in 2 weeks',
      'Current assets don\'t reflect latest messaging',
    ],
    evidenceLinks: [
      { label: 'Brand Kit', type: 'ga4' },
    ],
    isContentRelated: false,
    urgencyScore: 50,
    impactScore: 40,
    effortScore: 60,
  },
  {
    id: 'nba-10',
    title: 'Optimize blog internal linking structure',
    type: 'seo',
    funnelStage: 'awareness',
    impact: 'medium',
    confidence: 82,
    effort: 'M',
    whyNow: [
      '8 orphan pages with good rankings but no internal links',
      'Opportunity to boost topical authority',
    ],
    evidenceLinks: [
      { label: 'Content Audit', type: 'gsc' },
    ],
    isContentRelated: true,
    urgencyScore: 45,
    impactScore: 65,
    effortScore: 55,
  },
  {
    id: 'nba-11',
    title: 'Follow up with hot leads from webinar',
    type: 'crm',
    funnelStage: 'conversion',
    impact: 'high',
    confidence: 90,
    effort: 'S',
    whyNow: [
      '12 attendees requested demo — 3 days since event',
      'Response rate drops 50% after 48 hours',
    ],
    evidenceLinks: [
      { label: 'HubSpot Leads', type: 'hubspot' },
    ],
    isContentRelated: false,
    urgencyScore: 98,
    impactScore: 92,
    effortScore: 95,
  },
  {
    id: 'nba-12',
    title: 'Scale top-performing LinkedIn ad creative',
    type: 'paid',
    funnelStage: 'awareness',
    impact: 'medium',
    confidence: 88,
    effort: 'S',
    whyNow: [
      'Creative A has 2.1x better CTR than others',
      'Currently only 20% of budget allocated',
    ],
    evidenceLinks: [
      { label: 'LinkedIn Ads', type: 'linkedin' },
    ],
    isContentRelated: false,
    urgencyScore: 72,
    impactScore: 68,
    effortScore: 92,
  },
];

// Plan items for this week
export const planItems: PlanItem[] = [
  {
    id: 'plan-1',
    title: 'Team standup',
    type: 'meeting',
    owner: 'Team',
    dueDate: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: 'plan-2',
    title: 'Review LinkedIn Ads performance',
    type: 'task',
    channel: 'Paid',
    owner: 'Marie',
    dueDate: new Date().toISOString(),
    status: 'in-progress',
    relatedActionIds: ['nba-2', 'nba-12'],
  },
  {
    id: 'plan-3',
    title: 'Publish blog post: AI Trends 2024',
    type: 'content',
    channel: 'Content',
    owner: 'Thomas',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    relatedActionIds: ['nba-4'],
  },
  {
    id: 'plan-4',
    title: 'Q1 Campaign Launch',
    type: 'milestone',
    channel: 'Multi-channel',
    owner: 'Julie',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'pending',
  },
  {
    id: 'plan-5',
    title: 'Meta titles optimization sprint',
    type: 'task',
    channel: 'SEO',
    owner: 'Alex',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'pending',
    relatedActionIds: ['nba-1'],
  },
  {
    id: 'plan-6',
    title: 'Email win-back sequence draft',
    type: 'content',
    channel: 'CRM',
    owner: 'Sophie',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'pending',
    relatedActionIds: ['nba-5'],
  },
  {
    id: 'plan-7',
    title: 'LinkedIn post: Industry insights',
    type: 'content',
    channel: 'Social',
    owner: 'Thomas',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'pending',
    relatedActionIds: ['nba-7'],
  },
  {
    id: 'plan-8',
    title: 'Client QBR prep',
    type: 'meeting',
    owner: 'Account Team',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'pending',
  },
  {
    id: 'plan-9',
    title: 'Fix GA4 form tracking',
    type: 'task',
    channel: 'Tech',
    owner: 'Dev',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    relatedActionIds: ['nba-8'],
  },
];

// Context panel data
export interface ContextInsight {
  id: string;
  title: string;
  summary: string;
  type: 'anomaly' | 'monitoring' | 'meeting';
  severity: 'info' | 'warning' | 'opportunity';
}

export interface ContextAsset {
  id: string;
  name: string;
  type: 'template' | 'deck' | 'guideline' | 'doc';
  updatedAt: string;
}

export interface IntegrationStatus {
  name: string;
  status: 'connected' | 'error' | 'missing';
  lastSync?: string;
}

export const contextInsights: ContextInsight[] = [
  {
    id: 'ci-1',
    title: 'Traffic spike from Reddit',
    summary: 'Unexpected 340% traffic increase from r/marketing post',
    type: 'anomaly',
    severity: 'opportunity',
  },
  {
    id: 'ci-2',
    title: 'Competitor price change',
    summary: 'MarketForce reduced pricing by 15% on mid-tier plans',
    type: 'monitoring',
    severity: 'warning',
  },
  {
    id: 'ci-3',
    title: 'Sales call highlight',
    summary: '"Need better ROI tracking" mentioned 4x in demos this week',
    type: 'meeting',
    severity: 'info',
  },
];

export const contextAssets: ContextAsset[] = [
  { id: 'ca-1', name: 'Blog Post Template', type: 'template', updatedAt: '2 days ago' },
  { id: 'ca-2', name: 'Brand Guidelines v3', type: 'guideline', updatedAt: '1 week ago' },
  { id: 'ca-3', name: 'Q1 Campaign Deck', type: 'deck', updatedAt: '3 days ago' },
  { id: 'ca-4', name: 'SEO Best Practices', type: 'doc', updatedAt: '5 days ago' },
];

export const integrationStatuses: IntegrationStatus[] = [
  { name: 'Google Analytics', status: 'connected', lastSync: '5 min ago' },
  { name: 'Google Search Console', status: 'connected', lastSync: '1 hour ago' },
  { name: 'LinkedIn Ads', status: 'connected', lastSync: '30 min ago' },
  { name: 'HubSpot', status: 'error', lastSync: '2 hours ago' },
  { name: 'Google Ads', status: 'connected', lastSync: '15 min ago' },
];

export const recentActivity = [
  { id: 'ra-1', title: 'AI Marketing Trends 2024', type: 'blog', performance: 'trending', views: '2.4K' },
  { id: 'ra-2', title: 'LinkedIn Campaign A', type: 'ad', performance: 'top', leads: '34' },
  { id: 'ra-3', title: 'Product Demo Webinar', type: 'webinar', performance: 'good', registrations: '127' },
];

// Helper functions
export const actionTypeLabels: Record<ActionType, string> = {
  seo: 'SEO',
  content: 'Content',
  paid: 'Paid',
  social: 'Social',
  cro: 'CRO',
  crm: 'CRM',
  tech: 'Tech',
  brand: 'Brand',
};

export const actionTypeColors: Record<ActionType, string> = {
  seo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  content: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  cro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  crm: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  tech: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  brand: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const funnelStageLabels: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
};

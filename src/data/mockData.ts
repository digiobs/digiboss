// DigiObs Mock Data - Realistic B2B Marketing Data

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
}

export interface KPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  reasons: string[];
  category: string;
  status: 'new' | 'accepted' | 'implemented' | 'rejected';
  createdAt: string;
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: 'competitor' | 'seo' | 'product' | 'industry' | 'client';
  severity: 'info' | 'warning' | 'opportunity';
  source: string;
  createdAt: string;
  soWhat: string;
  recommendedActions: string[];
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  source: string;
  lastActivity: string;
  fitScore: number;
  intentScore: number;
  engagementScore: number;
  suggestedAction: string;
  suggestedChannel: 'email' | 'linkedin' | 'call';
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  channel: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  leads: number;
  conversions: number;
}

export interface Asset {
  id: string;
  name: string;
  type: 'logo' | 'deck' | 'guideline' | 'template' | 'image';
  version: string;
  tags: string[];
  updatedAt: string;
  url: string;
}

// Workspaces
export const workspaces: Workspace[] = [
  { id: '1', name: 'TechVenture Inc.' },
  { id: '2', name: 'GrowthLabs Agency' },
  { id: '3', name: 'Nexus Solutions' },
];

// KPIs
export const kpis: KPI[] = [
  { label: 'Traffic', value: '45.2K', change: 12.5, changeLabel: 'vs last week', trend: 'up' },
  { label: 'Leads', value: '234', change: 8.3, changeLabel: 'vs last week', trend: 'up' },
  { label: 'CAC', value: '$127', change: -5.2, changeLabel: 'vs last week', trend: 'up' },
  { label: 'Conversion', value: '3.8%', change: 0.4, changeLabel: 'vs last week', trend: 'up' },
  { label: 'Pipeline', value: '$892K', change: 15.7, changeLabel: 'vs last week', trend: 'up' },
];

// AI Recommendations
export const recommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Launch LinkedIn retargeting campaign',
    description: 'Website visitors who viewed pricing page but didn\'t convert show 3x higher intent signals.',
    impact: 'high',
    confidence: 87,
    effort: 'low',
    reasons: [
      '847 high-intent visitors in the last 14 days',
      'Similar campaigns achieved 4.2% conversion rate',
    ],
    category: 'Acquisition',
    status: 'new',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Optimize blog content for "AI marketing tools"',
    description: 'Keyword gap analysis shows opportunity to rank for 12 high-volume terms.',
    impact: 'high',
    confidence: 92,
    effort: 'medium',
    reasons: [
      'Search volume: 14,800/month for cluster',
      'Current ranking: Position 18 (page 2)',
    ],
    category: 'SEO',
    status: 'new',
    createdAt: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    title: 'A/B test pricing page headline',
    description: 'Heatmap data shows 67% of users don\'t scroll past the fold. Test value-focused copy.',
    impact: 'medium',
    confidence: 78,
    effort: 'low',
    reasons: [
      'Current bounce rate: 54%',
      'Potential 15-20% improvement based on benchmarks',
    ],
    category: 'Conversion',
    status: 'new',
    createdAt: '2024-01-14T16:45:00Z',
  },
  {
    id: '4',
    title: 'Re-engage dormant email subscribers',
    description: '2,340 subscribers haven\'t opened emails in 90 days. Win-back sequence recommended.',
    impact: 'medium',
    confidence: 71,
    effort: 'medium',
    reasons: [
      'Average win-back rate: 8-12%',
      'Potential recovery: 187-280 engaged subscribers',
    ],
    category: 'Engagement',
    status: 'new',
    createdAt: '2024-01-14T11:00:00Z',
  },
  {
    id: '5',
    title: 'Pause underperforming Google Ads',
    description: '3 ad groups have CPA 2.5x above target with no conversions this week.',
    impact: 'low',
    confidence: 95,
    effort: 'low',
    reasons: [
      'Wasted spend: $1,240 last 7 days',
      'Reallocate to top performers',
    ],
    category: 'Budget',
    status: 'new',
    createdAt: '2024-01-15T08:00:00Z',
  },
];

// Weekly Summary
export const weeklySummary = {
  headline: 'Strong week for lead generation',
  highlights: [
    'Traffic up 12.5% driven by organic search (+18%)',
    'LinkedIn Ads CPL dropped to $34 (target: $45)',
    'New blog post ranked #4 for "B2B marketing automation"',
    '3 enterprise leads entered pipeline ($180K potential)',
  ],
  concerns: [
    'Email open rates declining (22% → 18%)',
    'Google Ads CPA trending above target',
  ],
};

// Insights
export const insights: Insight[] = [
  {
    id: '1',
    title: 'Competitor launched AI feature',
    summary: 'MarketForce announced AI-powered campaign optimization. Feature overlaps with our Q2 roadmap.',
    content: 'Full analysis of competitor feature launch and market implications...',
    type: 'competitor',
    severity: 'warning',
    source: 'Product Hunt, LinkedIn',
    createdAt: '2024-01-15T14:30:00Z',
    soWhat: 'May accelerate customer questions about our AI capabilities. Sales team needs updated messaging.',
    recommendedActions: [
      'Brief sales team on competitive positioning',
      'Accelerate AI feature beta launch',
      'Prepare comparison content for website',
    ],
  },
  {
    id: '2',
    title: 'Google Core Update rolling out',
    summary: 'March 2024 Core Update emphasizes E-E-A-T signals. Early data shows content sites impacted.',
    content: 'Detailed analysis of algorithm changes and impact on rankings...',
    type: 'seo',
    severity: 'info',
    source: 'Search Engine Journal, Google Search Central',
    createdAt: '2024-01-15T09:00:00Z',
    soWhat: 'Our content strategy aligns well with E-E-A-T. Monitor rankings over next 2 weeks.',
    recommendedActions: [
      'Audit author pages for expertise signals',
      'Add more case studies to key pages',
      'Review and update outdated content',
    ],
  },
  {
    id: '3',
    title: 'Industry report: B2B buying cycles lengthening',
    summary: 'Forrester research shows average B2B purchase cycle increased by 22% in 2023.',
    content: 'Analysis of changing B2B buyer behavior and implications...',
    type: 'industry',
    severity: 'opportunity',
    source: 'Forrester Research',
    createdAt: '2024-01-14T16:00:00Z',
    soWhat: 'Longer cycles mean more touchpoints needed. Opportunity to strengthen nurture sequences.',
    recommendedActions: [
      'Extend email nurture sequence by 2 weeks',
      'Create mid-funnel content for consideration stage',
      'Implement lead scoring decay for stale leads',
    ],
  },
  {
    id: '4',
    title: 'Key client expanding to new market',
    summary: 'TechCorp announced expansion into APAC region. Current contract up for renewal in Q2.',
    content: 'Client intelligence briefing...',
    type: 'client',
    severity: 'opportunity',
    source: 'Press Release, LinkedIn',
    createdAt: '2024-01-14T11:30:00Z',
    soWhat: 'Upsell opportunity for regional marketing support. Schedule strategic review before renewal.',
    recommendedActions: [
      'Prepare APAC market analysis',
      'Schedule QBR with expanded agenda',
      'Draft proposal for regional support package',
    ],
  },
];

// Leads
export const leads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    company: 'Innovate Corp',
    email: 'sarah.chen@innovatecorp.com',
    score: 92,
    stage: 'qualified',
    source: 'LinkedIn Ads',
    lastActivity: '2 hours ago',
    fitScore: 95,
    intentScore: 88,
    engagementScore: 92,
    suggestedAction: 'Schedule demo call this week',
    suggestedChannel: 'email',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    company: 'Scale Dynamics',
    email: 'mjohnson@scaledyn.io',
    score: 87,
    stage: 'contacted',
    source: 'Content Download',
    lastActivity: '1 day ago',
    fitScore: 90,
    intentScore: 82,
    engagementScore: 88,
    suggestedAction: 'Send case study relevant to their industry',
    suggestedChannel: 'linkedin',
  },
  {
    id: '3',
    name: 'Emily Watson',
    company: 'Growth Partners',
    email: 'e.watson@growthpartners.co',
    score: 78,
    stage: 'new',
    source: 'Webinar',
    lastActivity: '3 days ago',
    fitScore: 85,
    intentScore: 72,
    engagementScore: 76,
    suggestedAction: 'Qualify with discovery questions',
    suggestedChannel: 'email',
  },
  {
    id: '4',
    name: 'David Kim',
    company: 'NextGen Solutions',
    email: 'dkim@nextgensol.com',
    score: 71,
    stage: 'qualified',
    source: 'Referral',
    lastActivity: '5 days ago',
    fitScore: 88,
    intentScore: 65,
    engagementScore: 60,
    suggestedAction: 'Re-engage with new content offer',
    suggestedChannel: 'call',
  },
  {
    id: '5',
    name: 'Lisa Park',
    company: 'Velocity Labs',
    email: 'lisa@velocitylabs.io',
    score: 65,
    stage: 'proposal',
    source: 'Google Ads',
    lastActivity: '1 week ago',
    fitScore: 75,
    intentScore: 70,
    engagementScore: 50,
    suggestedAction: 'Follow up on proposal - closing window',
    suggestedChannel: 'call',
  },
];

// Campaigns
export const campaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q1 Brand Awareness',
    status: 'active',
    channel: 'LinkedIn Ads',
    budget: 15000,
    spent: 8420,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    leads: 127,
    conversions: 12,
  },
  {
    id: '2',
    name: 'Product Launch - AI Features',
    status: 'draft',
    channel: 'Multi-channel',
    budget: 25000,
    spent: 0,
    startDate: '2024-02-15',
    endDate: '2024-03-15',
    leads: 0,
    conversions: 0,
  },
  {
    id: '3',
    name: 'Webinar Series - Marketing Trends',
    status: 'active',
    channel: 'Email + LinkedIn',
    budget: 5000,
    spent: 2100,
    startDate: '2024-01-10',
    endDate: '2024-02-28',
    leads: 89,
    conversions: 8,
  },
];

// Assets
export const assets: Asset[] = [
  { id: '1', name: 'Brand Logo - Primary', type: 'logo', version: '2.1', tags: ['brand', 'primary'], updatedAt: '2024-01-10', url: '#' },
  { id: '2', name: 'Sales Deck 2024', type: 'deck', version: '1.3', tags: ['sales', 'presentation'], updatedAt: '2024-01-12', url: '#' },
  { id: '3', name: 'Brand Guidelines', type: 'guideline', version: '3.0', tags: ['brand', 'design'], updatedAt: '2023-12-01', url: '#' },
  { id: '4', name: 'Email Template - Newsletter', type: 'template', version: '1.0', tags: ['email', 'marketing'], updatedAt: '2024-01-08', url: '#' },
  { id: '5', name: 'Social Media Kit', type: 'image', version: '2.0', tags: ['social', 'creative'], updatedAt: '2024-01-05', url: '#' },
];

// Chat messages example
export const chatHistory = [
  {
    role: 'user' as const,
    content: 'What\'s the biggest growth opportunity this month?',
  },
  {
    role: 'assistant' as const,
    content: 'Based on your current data, the biggest growth opportunity is **LinkedIn retargeting for pricing page visitors**.\n\n**Why this matters:**\n- 847 high-intent visitors viewed pricing but didn\'t convert\n- Similar campaigns achieved 4.2% conversion rate\n- Estimated potential: 35+ additional qualified leads\n\n**Confidence:** 87%\n\n**Recommended next steps:**\n1. Create retargeting audience in LinkedIn\n2. Design 2-3 ad variations with social proof\n3. Set initial budget at $50/day for testing',
  },
];

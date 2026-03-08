// Analytics Dashboard Mock Data

export interface KPIData {
  label: string;
  value: string | number;
  delta: number;
  deltaLabel: string;
  category: 'website' | 'activation' | 'conversion' | 'acquisition' | 'paid' | 'social';
}

export interface TimeSeriesData {
  date: string;
  value: number;
  previousValue?: number;
}

export interface ChannelConversion {
  channel: string;
  conversions: number;
  share: number;
  color: string;
}

export interface LeadData {
  id: string;
  date: string;
  source: string;
  lastSeen: string;
  page: string;
  contact: string;
  email: string;
}

export interface AudienceGeo {
  location: string;
  users: number;
  sessions: number;
  share: number;
}

export interface ContentPerformance {
  page: string;
  views: number;
  avgEngagement: string;
  keyEvents: number;
  conversions: number;
  entryRate: number;
}

export interface SEOKeyword {
  keyword: string;
  landingPage: string;
  currentPosition: number;
  previousPosition: number;
  change: number;
  volume: number;
}

export interface SEOQuery {
  query: string;
  impressions: number;
  avgPosition: number;
  ctr: number;
  clicks: number;
  impressionsDelta: number;
  clicksDelta: number;
}

export interface SocialPost {
  id: string;
  content: string;
  date: string;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface CampaignData {
  name: string;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  status: 'active' | 'paused' | 'ended';
}

export interface AIInsight {
  type: 'change' | 'impact' | 'action';
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  confidence?: number;
  effort?: 'S' | 'M' | 'L';
}

// At-a-glance KPI Strip Data
export const kpiStripData: KPIData[] = [
  // Website (GA4)
  { label: 'Sessions', value: '45,892', delta: 12.4, deltaLabel: 'vs prev period', category: 'website' },
  { label: 'New Users', value: '32,156', delta: 8.7, deltaLabel: 'vs prev period', category: 'website' },
  { label: 'Pageviews', value: '128,445', delta: 15.2, deltaLabel: 'vs prev period', category: 'website' },
  { label: 'Avg. Session', value: '2m 34s', delta: -5.3, deltaLabel: 'vs prev period', category: 'website' },
  { label: 'Bounce Rate', value: '42.3%', delta: -8.1, deltaLabel: 'vs prev period', category: 'website' },
  // Activation
  { label: 'Key Events', value: '3,842', delta: 22.1, deltaLabel: 'vs prev period', category: 'activation' },
  // Conversion
  { label: 'Conversions', value: '287', delta: 18.5, deltaLabel: 'vs prev period', category: 'conversion' },
  { label: 'Conv. Rate', value: '0.63%', delta: 5.4, deltaLabel: 'vs prev period', category: 'conversion' },
  { label: 'New Leads', value: '156', delta: 24.8, deltaLabel: 'HubSpot', category: 'conversion' },
  // Acquisition (SEO)
  { label: 'SEO Clicks', value: '18,432', delta: 14.2, deltaLabel: 'vs prev period', category: 'acquisition' },
  { label: 'Impressions', value: '892K', delta: 28.6, deltaLabel: 'vs prev period', category: 'acquisition' },
  { label: 'Domain Auth.', value: '45', delta: 2, deltaLabel: 'pts', category: 'acquisition' },
  // Paid
  { label: 'Ad Spend', value: '€8,420', delta: -3.2, deltaLabel: 'vs prev period', category: 'paid' },
  { label: 'Ad Clicks', value: '4,521', delta: 11.8, deltaLabel: 'vs prev period', category: 'paid' },
  // Social
  { label: 'LI Impressions', value: '45.2K', delta: 32.4, deltaLabel: 'vs prev period', category: 'social' },
  { label: 'LI Followers', value: '2,847', delta: 156, deltaLabel: 'new', category: 'social' },
];

// Sessions Time Series
export const sessionsTimeSeries: TimeSeriesData[] = [
  { date: '2024-01-01', value: 1450, previousValue: 1280 },
  { date: '2024-01-02', value: 1620, previousValue: 1350 },
  { date: '2024-01-03', value: 1890, previousValue: 1520 },
  { date: '2024-01-04', value: 1780, previousValue: 1480 },
  { date: '2024-01-05', value: 1540, previousValue: 1320 },
  { date: '2024-01-06', value: 980, previousValue: 890 },
  { date: '2024-01-07', value: 920, previousValue: 850 },
  { date: '2024-01-08', value: 1680, previousValue: 1420 },
  { date: '2024-01-09', value: 1820, previousValue: 1580 },
  { date: '2024-01-10', value: 2010, previousValue: 1650 },
  { date: '2024-01-11', value: 1950, previousValue: 1720 },
  { date: '2024-01-12', value: 1760, previousValue: 1480 },
  { date: '2024-01-13', value: 1020, previousValue: 920 },
  { date: '2024-01-14', value: 980, previousValue: 880 },
];

// Key Events Time Series
export const keyEventsTimeSeries: TimeSeriesData[] = [
  { date: '2024-01-01', value: 142 },
  { date: '2024-01-02', value: 168 },
  { date: '2024-01-03', value: 195 },
  { date: '2024-01-04', value: 178 },
  { date: '2024-01-05', value: 156 },
  { date: '2024-01-06', value: 89 },
  { date: '2024-01-07', value: 76 },
  { date: '2024-01-08', value: 182 },
  { date: '2024-01-09', value: 201 },
  { date: '2024-01-10', value: 224 },
  { date: '2024-01-11', value: 198 },
  { date: '2024-01-12', value: 167 },
  { date: '2024-01-13', value: 92 },
  { date: '2024-01-14', value: 84 },
];

// Channel Conversions
export const channelConversions: ChannelConversion[] = [
  { channel: 'Organic Search', conversions: 98, share: 34.1, color: 'hsl(142, 76%, 36%)' },
  { channel: 'Direct', conversions: 67, share: 23.3, color: 'hsl(221, 83%, 53%)' },
  { channel: 'Paid Search', conversions: 54, share: 18.8, color: 'hsl(38, 92%, 50%)' },
  { channel: 'Display', conversions: 38, share: 13.2, color: 'hsl(280, 65%, 60%)' },
  { channel: 'Social', conversions: 18, share: 6.3, color: 'hsl(190, 80%, 45%)' },
  { channel: 'Referral', conversions: 12, share: 4.2, color: 'hsl(340, 75%, 55%)' },
];

// Key Events by Name
export const keyEventsByName = [
  { name: 'DO_formulaire_contact', count: 287, share: 42.5 },
  { name: 'DO_download_brochure', count: 156, share: 23.1 },
  { name: 'DO_request_demo', count: 98, share: 14.5 },
  { name: 'DO_newsletter_signup', count: 78, share: 11.6 },
  { name: 'DO_video_play', count: 56, share: 8.3 },
];

// Landing Page Conversions
export const landingPageConversions = [
  { page: '/solutions/erp-logiciel', sessions: 4521, conversions: 48, convRate: 1.06 },
  { page: '/solutions/crm-gestion', sessions: 3892, conversions: 42, convRate: 1.08 },
  { page: '/demo-gratuite', sessions: 2156, conversions: 38, convRate: 1.76 },
  { page: '/tarifs', sessions: 3245, conversions: 35, convRate: 1.08 },
  { page: '/solutions/comptabilite', sessions: 2890, conversions: 28, convRate: 0.97 },
  { page: '/blog/guide-erp-2024', sessions: 5678, conversions: 24, convRate: 0.42 },
  { page: '/contact', sessions: 1245, conversions: 22, convRate: 1.77 },
  { page: '/ressources/livre-blanc', sessions: 1890, conversions: 18, convRate: 0.95 },
];

// Zero Conversion Pages (Opportunities)
export const zeroConversionPages = [
  { page: '/blog/tendances-digitales', sessions: 3421, avgTime: '3m 12s' },
  { page: '/a-propos', sessions: 2156, avgTime: '1m 45s' },
  { page: '/blog/transformation-numerique', sessions: 1987, avgTime: '2m 58s' },
  { page: '/partenaires', sessions: 1245, avgTime: '2m 10s' },
  { page: '/actualites', sessions: 1098, avgTime: '1m 32s' },
];

// Leads Data
export const leadsData: LeadData[] = [
  { id: '1', date: '2024-01-14', source: 'Organic Search', lastSeen: '2h ago', page: '/solutions/erp-logiciel', contact: 'Marie Dupont', email: 'm.dupont@huckoccitania.fr' },
  { id: '2', date: '2024-01-14', source: 'Paid Search', lastSeen: '4h ago', page: '/demo-gratuite', contact: 'Jean Martin', email: 'j.martin@veinsound.io' },
  { id: '3', date: '2024-01-13', source: 'LinkedIn', lastSeen: '1d ago', page: '/tarifs', contact: 'Sophie Bernard', email: 's.bernard@srainstruments.com' },
  { id: '4', date: '2024-01-13', source: 'Direct', lastSeen: '1d ago', page: '/contact', contact: 'Pierre Leroy', email: 'p.leroy@amont.fr' },
  { id: '5', date: '2024-01-12', source: 'Referral', lastSeen: '2d ago', page: '/solutions/crm-gestion', contact: 'Claire Moreau', email: 'c.moreau@apmoniatx.com' },
];

// Lead Sources Breakdown
export const leadSourceBreakdown = [
  { source: 'Organic Search', leads: 52, share: 33.3 },
  { source: 'Paid Search', leads: 38, share: 24.4 },
  { source: 'Direct', leads: 28, share: 17.9 },
  { source: 'LinkedIn', leads: 22, share: 14.1 },
  { source: 'Referral', leads: 16, share: 10.3 },
];

// Audience Geography
export const audienceByCountry: AudienceGeo[] = [
  { location: 'France', users: 28456, sessions: 38920, share: 68.2 },
  { location: 'Belgium', users: 4521, sessions: 5890, share: 10.8 },
  { location: 'Switzerland', users: 3892, sessions: 4980, share: 9.3 },
  { location: 'Canada', users: 2456, sessions: 3120, share: 5.9 },
  { location: 'Luxembourg', users: 1245, sessions: 1650, share: 3.0 },
  { location: 'Other', users: 1178, sessions: 1332, share: 2.8 },
];

export const audienceByRegion: AudienceGeo[] = [
  { location: 'Île-de-France', users: 12456, sessions: 16890, share: 38.9 },
  { location: 'Auvergne-Rhône-Alpes', users: 4521, sessions: 5980, share: 13.8 },
  { location: 'Provence-Alpes-Côte d\'Azur', users: 3245, sessions: 4280, share: 9.9 },
  { location: 'Occitanie', users: 2890, sessions: 3820, share: 8.8 },
  { location: 'Nouvelle-Aquitaine', users: 2456, sessions: 3240, share: 7.5 },
  { location: 'Other', users: 6888, sessions: 9782, share: 21.1 },
];

export const audienceByCity: AudienceGeo[] = [
  { location: 'Paris', users: 8956, sessions: 12450, share: 28.6 },
  { location: 'Lyon', users: 2845, sessions: 3890, share: 9.0 },
  { location: 'Marseille', users: 1892, sessions: 2540, share: 5.8 },
  { location: 'Toulouse', users: 1654, sessions: 2210, share: 5.1 },
  { location: 'Bordeaux', users: 1456, sessions: 1950, share: 4.5 },
  { location: 'Other', users: 14953, sessions: 20852, share: 47.0 },
];

export const deviceBreakdown = [
  { device: 'Desktop', users: 28456, share: 68.5 },
  { device: 'Mobile', users: 11234, share: 27.0 },
  { device: 'Tablet', users: 1866, share: 4.5 },
];

// Content Performance
export const contentPerformanceData: ContentPerformance[] = [
  { page: '/solutions/erp-logiciel', views: 12456, avgEngagement: '3m 24s', keyEvents: 342, conversions: 48, entryRate: 32.4 },
  { page: '/blog/guide-erp-2024', views: 8921, avgEngagement: '4m 12s', keyEvents: 256, conversions: 24, entryRate: 45.2 },
  { page: '/solutions/crm-gestion', views: 7845, avgEngagement: '2m 58s', keyEvents: 198, conversions: 42, entryRate: 28.6 },
  { page: '/tarifs', views: 6234, avgEngagement: '2m 15s', keyEvents: 312, conversions: 35, entryRate: 18.9 },
  { page: '/demo-gratuite', views: 5421, avgEngagement: '1m 45s', keyEvents: 421, conversions: 38, entryRate: 22.1 },
  { page: '/blog/transformation-numerique', views: 4892, avgEngagement: '3m 56s', keyEvents: 145, conversions: 12, entryRate: 38.4 },
  { page: '/ressources/livre-blanc', views: 3654, avgEngagement: '2m 32s', keyEvents: 234, conversions: 18, entryRate: 41.2 },
  { page: '/contact', views: 2890, avgEngagement: '1m 28s', keyEvents: 187, conversions: 22, entryRate: 12.3 },
];

// SEO Data
export const seoKeywordPositions: SEOKeyword[] = [
  { keyword: 'logiciel erp pme', landingPage: '/solutions/erp-logiciel', currentPosition: 3, previousPosition: 5, change: 2, volume: 2400 },
  { keyword: 'erp cloud france', landingPage: '/solutions/erp-logiciel', currentPosition: 4, previousPosition: 4, change: 0, volume: 1800 },
  { keyword: 'crm gestion commerciale', landingPage: '/solutions/crm-gestion', currentPosition: 6, previousPosition: 8, change: 2, volume: 1600 },
  { keyword: 'logiciel comptabilité entreprise', landingPage: '/solutions/comptabilite', currentPosition: 8, previousPosition: 6, change: -2, volume: 2100 },
  { keyword: 'transformation digitale pme', landingPage: '/blog/transformation-numerique', currentPosition: 12, previousPosition: 15, change: 3, volume: 890 },
  { keyword: 'guide choix erp 2024', landingPage: '/blog/guide-erp-2024', currentPosition: 2, previousPosition: 3, change: 1, volume: 720 },
  { keyword: 'logiciel gestion entreprise', landingPage: '/solutions/erp-logiciel', currentPosition: 18, previousPosition: 22, change: 4, volume: 3200 },
  { keyword: 'devis erp gratuit', landingPage: '/demo-gratuite', currentPosition: 5, previousPosition: 7, change: 2, volume: 580 },
];

export const seoQueries: SEOQuery[] = [
  { query: 'logiciel erp', impressions: 45200, avgPosition: 8.4, ctr: 4.2, clicks: 1898, impressionsDelta: 12.4, clicksDelta: 18.2 },
  { query: 'erp pme', impressions: 32100, avgPosition: 5.2, ctr: 6.8, clicks: 2183, impressionsDelta: 8.6, clicksDelta: 15.4 },
  { query: 'logiciel gestion', impressions: 28900, avgPosition: 12.1, ctr: 2.4, clicks: 694, impressionsDelta: 22.1, clicksDelta: 28.6 },
  { query: 'crm français', impressions: 18400, avgPosition: 6.8, ctr: 5.6, clicks: 1030, impressionsDelta: -3.2, clicksDelta: 4.8 },
  { query: 'comptabilité cloud', impressions: 15200, avgPosition: 9.4, ctr: 3.8, clicks: 578, impressionsDelta: 14.5, clicksDelta: 11.2 },
  { query: 'erp cloud', impressions: 12800, avgPosition: 7.2, ctr: 5.1, clicks: 653, impressionsDelta: 6.8, clicksDelta: 9.4 },
];

export const seoKeywordDistribution = {
  top3: 12,
  top10: 45,
  top20: 89,
  top100: 234,
};

export const seoTechnicalHealth = {
  score: 87,
  errors: 12,
  warnings: 45,
  notices: 128,
  categories: [
    { name: 'Crawlability', score: 92 },
    { name: 'HTTPS', score: 100 },
    { name: 'Performance', score: 78 },
    { name: 'Internal Linking', score: 85 },
    { name: 'Core Web Vitals', score: 72 },
  ],
};

// Social Data (LinkedIn)
export const socialKPIs = {
  followers: 2847,
  newFollowers: 156,
  newFollowersDelta: 24.8,
  impressions: 45200,
  impressionsDelta: 32.4,
  engagements: 2890,
  engagementsDelta: 18.6,
  clicks: 1245,
  clicksDelta: 28.2,
  likes: 1892,
  likesDelta: 22.4,
};

export const bestPosts: SocialPost[] = [
  { id: '1', content: '🚀 Notre guide complet sur la transformation digitale des PME est maintenant disponible...', date: '2024-01-10', impressions: 8456, clicks: 342, likes: 156, comments: 28, shares: 45 },
  { id: '2', content: '💡 5 erreurs à éviter lors du choix de votre ERP. Article complet sur notre blog...', date: '2024-01-08', impressions: 6234, clicks: 278, likes: 124, comments: 18, shares: 32 },
  { id: '3', content: '📊 Retour d\'expérience : comment Amarok a augmenté sa productivité de 40%...', date: '2024-01-05', impressions: 5890, clicks: 245, likes: 98, comments: 22, shares: 28 },
];

// Paid Performance (Google Ads)
export const googleAdsKPIs = {
  clicks: 4521,
  clicksDelta: 11.8,
  impressions: 125400,
  impressionsDelta: 8.4,
  ctr: 3.6,
  ctrDelta: 3.1,
  conversions: 54,
  conversionsDelta: 18.2,
  conversionRate: 1.19,
  conversionRateDelta: 5.7,
  spend: 8420,
  spendDelta: -3.2,
  avgCpc: 1.86,
  avgCpcDelta: -13.4,
  avgCpm: 67.14,
  cpa: 155.93,
  cpaDelta: -18.1,
};

export const googleAdsCampaigns: CampaignData[] = [
  { name: 'Brand - France', clicks: 1245, ctr: 8.2, spend: 1890, conversions: 18, status: 'active' },
  { name: 'ERP Solutions', clicks: 1456, ctr: 2.8, spend: 2890, conversions: 16, status: 'active' },
  { name: 'CRM Generic', clicks: 892, ctr: 2.4, spend: 1980, conversions: 12, status: 'active' },
  { name: 'Remarketing - Site Visitors', clicks: 678, ctr: 4.6, spend: 1120, conversions: 8, status: 'active' },
  { name: 'Display - Awareness', clicks: 250, ctr: 0.4, spend: 540, conversions: 0, status: 'paused' },
];

export const googleAdsTimeSeries: TimeSeriesData[] = [
  { date: '2024-01-01', value: 145 },
  { date: '2024-01-02', value: 168 },
  { date: '2024-01-03', value: 192 },
  { date: '2024-01-04', value: 178 },
  { date: '2024-01-05', value: 156 },
  { date: '2024-01-06', value: 89 },
  { date: '2024-01-07', value: 76 },
  { date: '2024-01-08', value: 182 },
  { date: '2024-01-09', value: 198 },
  { date: '2024-01-10', value: 212 },
  { date: '2024-01-11', value: 195 },
  { date: '2024-01-12', value: 167 },
  { date: '2024-01-13', value: 92 },
  { date: '2024-01-14', value: 84 },
];

// LinkedIn Ads Integration Status
export const linkedInAdsStatus = {
  connected: false,
  lastSync: null,
  error: 'Not available - LinkedIn Ads API data source is disconnected',
  errorCode: 'LI_DATA_NA',
};

// AI Insights
export const aiInsights: AIInsight[] = [
  { type: 'change', title: 'Organic traffic up 18%', description: 'Blog content optimizations from last month are paying off. Top performer: Guide ERP 2024.' },
  { type: 'change', title: 'Google Ads CPA down 18%', description: 'Brand campaign restructuring improved efficiency. Consider increasing budget allocation.' },
  { type: 'change', title: 'LinkedIn engagement spike', description: 'Customer success story post outperformed benchmarks by 3x. Replicate this format.' },
  { type: 'impact', title: 'High-intent pages underperforming', description: '/tarifs page has high traffic but below-average conversion. Consider A/B testing pricing presentation.' },
  { type: 'impact', title: 'Mobile bounce rate elevated', description: '52% of mobile users bounce vs 38% desktop. Page speed optimization recommended.' },
];

export const aiActions: AIInsight[] = [
  { type: 'action', title: 'Pause Display - Awareness campaign', description: '0 conversions, €540 spent. Reallocate to Brand campaign.', impact: 'high', confidence: 92, effort: 'S' },
  { type: 'action', title: 'Create ERP comparison content', description: '"logiciel erp comparatif" has 1.8K monthly searches, no ranking page.', impact: 'high', confidence: 78, effort: 'M' },
  { type: 'action', title: 'Add CTA to top blog posts', description: '5 high-traffic blogs have 0 conversions. Quick win opportunity.', impact: 'medium', confidence: 85, effort: 'S' },
  { type: 'action', title: 'Fix Core Web Vitals issues', description: 'LCP 4.2s on mobile affecting SEO. Technical debt payoff.', impact: 'medium', confidence: 88, effort: 'M' },
  { type: 'action', title: 'Launch LinkedIn lead gen campaign', description: 'Organic performing well. Paid can amplify reach to lookalike audiences.', impact: 'high', confidence: 65, effort: 'L' },
];

// Filter Options
export const filterOptions = {
  countries: ['France', 'Belgium', 'Switzerland', 'Canada', 'Luxembourg'],
  regions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine'],
  devices: ['Desktop', 'Mobile', 'Tablet'],
  channels: ['Organic Search', 'Direct', 'Paid Search', 'Display', 'Social', 'Referral', 'Email'],
  languages: ['FR', 'EN'],
};

export type ContentType = 'blog-post' | 'testimonial' | 'webinar' | 'linkedin-post' | 'landing-page';

export type FunnelStage = 'awareness' | 'consideration' | 'conversion';

export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published';

export type ImpactType = 'traffic' | 'leads' | 'seo' | 'paid-efficiency' | 'authority';

export type ContentObjective = 'seo-growth' | 'lead-gen' | 'thought-leadership' | 'product-adoption';

export interface ScoreBreakdown {
  demandSignal: number; // 0-30
  impactPotential: number; // 0-30
  feasibility: number; // 0-20
  timing: number; // 0-10
  distributionAdvantage: number; // 0-10
}

export interface EvidenceLink {
  type: 'insight' | 'keyword' | 'page' | 'campaign' | 'transcript';
  label: string;
  url?: string;
}

export interface ContentOpportunity {
  id: string;
  suggestedTitle: string;
  suggestedAngle: string;
  contentType: ContentType;
  funnelStage: FunnelStage;
  opportunityScore: number; // 0-100
  scoreBreakdown: ScoreBreakdown;
  impacts: ImpactType[];
  confidence: number; // 0-100
  whyNow: string[];
  evidenceLinks: EvidenceLink[];
  createdAt: string;
  objective?: ContentObjective;
  persona?: string;
  channel?: string;
  language?: 'fr' | 'en';
}

export interface ContentItem {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  funnelStage: FunnelStage;
  owner?: string;
  dueDate?: string;
  scheduledDate?: string;
  publishedDate?: string;
  content?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
  // Performance metrics (for published content)
  performance?: ContentPerformance;
}

export interface ContentPerformance {
  sessions: number;
  engagementRate: number;
  conversions: number;
  leadsAssisted: number;
  recommendation: 'keep' | 'improve' | 'kill';
  learnings?: string[];
}

export interface ContentTemplate {
  contentType: ContentType;
  label: string;
  description: string;
  icon: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'list';
}

export const contentTypeLabels: Record<ContentType, string> = {
  'blog-post': 'Blog Post',
  'testimonial': 'Testimonial',
  'webinar': 'Webinar',
  'linkedin-post': 'LinkedIn Post',
  'landing-page': 'Landing Page',
};

export const funnelStageLabels: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  idea: 'Idea',
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
};

export const impactTypeLabels: Record<ImpactType, string> = {
  traffic: 'Traffic',
  leads: 'Leads',
  seo: 'SEO',
  'paid-efficiency': 'Paid Efficiency',
  authority: 'Authority',
};

export const objectiveLabels: Record<ContentObjective, string> = {
  'seo-growth': 'SEO Growth',
  'lead-gen': 'Lead Generation',
  'thought-leadership': 'Thought Leadership',
  'product-adoption': 'Product Adoption',
};

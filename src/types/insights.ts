// DigiObs Insights Types - Meeting-first intelligence system

// ============ Meeting Insights (tl;dv) ============

export interface MeetingParticipant {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarUrl?: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  startTime: number; // seconds
  endTime: number;
  isHighlight?: boolean;
}

export interface MeetingHighlight {
  id: string;
  title: string;
  timestamp: number; // seconds
  type: 'decision' | 'action' | 'problem' | 'opportunity' | 'key_moment';
}

export interface VerbatimTag {
  type: 'pain' | 'objection' | 'benefit' | 'proof' | 'feature';
  label: string;
  color: string;
}

export interface Verbatim {
  id: string;
  text: string;
  speakerName: string;
  speakerId: string;
  timestamp: number; // seconds
  meetingId: string;
  tags: VerbatimTag['type'][];
}

export interface MeetingAISummary {
  decisions: string[];
  problems: string[];
  opportunities: string[];
  actionItems: {
    action: string;
    owner?: string;
    dueDate?: string;
  }[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  videoUrl?: string;
  thumbnailUrl?: string;
  transcriptStatus: 'processing' | 'ready' | 'failed';
  participants: MeetingParticipant[];
  transcript: TranscriptSegment[];
  highlights: MeetingHighlight[];
  verbatims: Verbatim[];
  aiSummary: MeetingAISummary;
  nbaCount: number;
  tags: string[];
  workflowTags: ('branding' | 'content' | 'web' | 'growth')[];
}

// ============ NBA (Next Best Actions) ============

export type NBAStatus = 'proposed' | 'accepted' | 'rejected' | 'implemented';
export type NBAType = 'seo' | 'content' | 'paid' | 'social' | 'cro' | 'crm' | 'tracking' | 'brand';
export type NBAFunnel = 'awareness' | 'consideration' | 'conversion';
export type NBAImpact = 'high' | 'medium' | 'low';
export type NBAEffort = 's' | 'm' | 'l';

export interface NBAEvidence {
  type: 'meeting_timestamp' | 'verbatim' | 'transcript' | 'performance_data';
  meetingId?: string;
  timestamp?: number;
  text?: string;
  source?: string;
  link?: string;
}

export interface NBA {
  id: string;
  title: string;
  type: NBAType;
  funnel: NBAFunnel;
  impact: NBAImpact;
  effort: NBAEffort;
  confidence: number; // 0-100
  whyBullets: string[];
  evidence: NBAEvidence[];
  status: NBAStatus;
  rejectionReason?: 'already_done' | 'not_relevant' | 'missing_context' | 'data_wrong';
  rejectionNote?: string;
  assignedTo?: string;
  createdAt: string;
  meetingId?: string;
  score: number; // 0-100
}

// ============ Performance Insights ============

export interface PerformanceInsight {
  id: string;
  source: 'ga4' | 'gsc' | 'ads' | 'linkedin';
  tldr: string;
  soWhat: string;
  evidence: {
    label: string;
    link?: string;
  }[];
  nba?: NBA;
  score: number;
  impact: NBAImpact;
  urgency: 'now' | 'soon' | 'later';
  status: 'new' | 'reviewed' | 'actioned' | 'archived';
  theme: NBAType;
  createdAt: string;
}

// ============ External Insights (Perplexity) ============

export interface PerplexityCitation {
  title: string;
  url: string;
  date?: string;
}

export interface ExternalInsight {
  id: string;
  perplexityQuestion: string;
  tldr: string;
  soWhat: string;
  citations: PerplexityCitation[];
  confidence: number; // Lower if citations missing
  isVerified: boolean;
  score: number;
  impact: NBAImpact;
  urgency: 'now' | 'soon' | 'later';
  status: 'new' | 'reviewed' | 'actioned' | 'archived';
  theme: NBAType;
  createdAt: string;
}

// ============ Ops Insights ============

export interface OpsInsight {
  id: string;
  type: 'blocker' | 'validation_pending' | 'dependency_missing';
  title: string;
  description: string;
  linkedTaskId?: string;
  linkedMeetingId?: string;
  score: number;
  impact: NBAImpact;
  urgency: 'now' | 'soon' | 'later';
  status: 'new' | 'reviewed' | 'actioned' | 'archived';
  createdAt: string;
}

// ============ Filter Types ============

export type InsightSourceFilter = 'all' | 'meetings' | 'performance' | 'external' | 'ops';
export type InsightThemeFilter = 'all' | NBAType;
export type InsightImpactFilter = 'all' | NBAImpact;
export type InsightStatusFilter = 'all' | 'new' | 'reviewed' | 'actioned' | 'archived';

export interface InsightsFilters {
  source: InsightSourceFilter;
  theme: InsightThemeFilter;
  impact: InsightImpactFilter;
  status: InsightStatusFilter;
  search: string;
}

export type WorkflowType = 'branding' | 'content' | 'web' | 'growth';
export type RiskLevel = 'green' | 'amber' | 'red';
export type Priority = 'P1' | 'P2' | 'P3';
export type TaskStatus = 'idea' | 'proposal' | 'in_progress' | 'to_validate' | 'to_publish' | 'waiting_client' | 'completed';
export type VerbatimTag = 'pain' | 'benefit' | 'objection' | 'proof' | 'feature';
export type RecommendationStatus = 'proposed' | 'accepted' | 'rejected' | 'implemented';
export type ActorType = 'human' | 'strategy_agent' | 'analytics_agent' | 'orchestration_agent';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type EffortLevel = 'S' | 'M' | 'L';

export interface WorkflowHealth {
  id: string;
  workflow: WorkflowType;
  progress: number;
  currentPhase: string;
  risk: RiskLevel;
  blockers: number;
}

export interface Milestone {
  id: string;
  title: string;
  date: Date;
  workflow: WorkflowType;
  type: 'milestone' | 'communication' | 'meeting';
  isAtRisk?: boolean;
}

export interface MeetingTranscript {
  id: string;
  title: string;
  date: Date;
  attendees: string[];
  tags: string[];
  duration: number; // minutes
  hasActionItems: boolean;
}

export interface MeetingSummary {
  mainIdeas: string[];
  problemPoints: string[];
  decisions: string[];
  actionItems: { text: string; assignee?: string; dueDate?: Date }[];
}

export interface Verbatim {
  id: string;
  quote: string;
  speaker: string;
  tag: VerbatimTag;
  meetingId: string;
  timestamp?: string;
}

export interface FollowupTask {
  id: string;
  title: string;
  description?: string;
  workflow: WorkflowType;
  owner: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: Date;
  linkedMeetingId?: string;
  linkedAssets?: { type: 'figma' | 'sharepoint'; name: string; url?: string }[];
  checklist?: { text: string; completed: boolean }[];
  comments?: { author: string; text: string; date: Date }[];
}

export interface FollowupRecommendation {
  id: string;
  title: string;
  impact: ImpactLevel;
  confidence: number;
  effort: EffortLevel;
  whyBullets: string[];
  status: RecommendationStatus;
  learningNote?: string;
  sources?: { type: string; label: string }[];
}

export interface ActivityItem {
  id: string;
  timestamp: Date;
  actor: ActorType;
  actorName?: string;
  action: string;
  sourceType?: 'task' | 'meeting' | 'report' | 'milestone';
  sourceId?: string;
  sourceLabel?: string;
}

export interface SystemHealth {
  orchestrationStatus: 'active' | 'idle';
  lastSync: Date;
  connectorErrors: number;
}

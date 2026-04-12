// Task types for DigiObs Plan
import type { ContentType, ContentStatus, FunnelStage } from '@/types/content';

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType = 'contenu' | 'seo' | 'design' | 'social_media' | 'strategie' | 'autre';
export type Canal = 'LinkedIn' | 'Blog' | 'YouTube' | 'Newsletter' | 'Email' | 'Site web';
export type ContentFormat = 'Article' | 'Post' | 'Carrousel' | 'Vidéo' | 'Infographie' | 'Story' | 'Podcast';

export interface TeamMemberRef {
  id: string;
  name: string;
  wrikeContactId?: string;
}

export interface ResourceLink {
  type: 'figma' | 'gdocs' | 'page' | 'other';
  url: string;
  label: string;
}

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: string }[] = [
  { value: 'contenu', label: 'Contenu', icon: 'FileText' },
  { value: 'seo', label: 'SEO', icon: 'Search' },
  { value: 'design', label: 'Design', icon: 'Palette' },
  { value: 'social_media', label: 'Social Media', icon: 'Share2' },
  { value: 'strategie', label: 'Stratégie', icon: 'Target' },
  { value: 'autre', label: 'Autre', icon: 'MoreHorizontal' },
];

export const CANAL_OPTIONS: Canal[] = ['LinkedIn', 'Blog', 'YouTube', 'Newsletter', 'Email', 'Site web'];

export const CANAL_FORMAT_MAP: Record<Canal, ContentFormat[]> = {
  'LinkedIn': ['Post', 'Carrousel', 'Article', 'Vidéo', 'Infographie'],
  'Blog': ['Article'],
  'YouTube': ['Vidéo'],
  'Newsletter': ['Article'],
  'Email': ['Article'],
  'Site web': ['Article', 'Infographie', 'Vidéo'],
};

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'review', label: 'En revue' },
  { value: 'done', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  assignee: string | null;
  assigneeIds: TeamMemberRef[];
  dueDate: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  linkedCampaign?: string;
  estimatedHours?: number;
  aiGenerated?: boolean;
  // Content fields (Wrike mapping)
  canal?: string;
  format?: string;
  thematique?: string;
  motCleCible?: string;
  nombreMots?: number;
  effortReserve?: number;
  resourceLinks?: ResourceLink[];
  // Admin financial fields
  budgetTache?: number;
  tarifCatalogue?: number;
  forfaitMensuel?: number;
  sousTraitance?: number;
  marge?: number;
  // Content Creator linking
  linkedContentId?: string;
  linkedContentType?: 'opportunity' | 'content-item';
  sourceModule?: 'content-creator' | 'insights' | 'followup';
  // Wrike linkage
  wrikeTaskId?: string;
  wrikeStepId?: string;
  wrikeProjectId?: string;
  wrikePermalink?: string;
  syncToWrike?: boolean;
}

// Form data for create/edit
export interface TaskFormData {
  title: string;
  description: string;
  taskType: TaskType;
  clientId: string;
  canal: Canal | '';
  format: ContentFormat | '';
  thematique: string;
  startDate: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  motCleCible: string;
  nombreMots: number | null;
  resourceLinks: ResourceLink[];
  effortReserve: number | null;
  assigneeIds: TeamMemberRef[];
  tags: string[];
  budgetTache: number | null;
  tarifCatalogue: number | null;
  forfaitMensuel: number | null;
  sousTraitance: number | null;
  marge: number | null;
  syncToWrike: boolean;
  // Content item fields (when taskType === 'contenu')
  contentType?: ContentType | null;
  contentStatus?: ContentStatus | null;
  funnelStage?: FunnelStage | null;
}

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review Q1 content calendar',
    description: 'Review and approve the Q1 content calendar including blog posts, social media, and email campaigns. Ensure alignment with product launch timeline.',
    status: 'done',
    priority: 'high',
    taskType: 'strategie',
    assignee: 'Alex',
    assigneeIds: [{ id: '1', name: 'Alex' }],
    startDate: '2024-01-02',
    dueDate: '2024-01-10',
    createdAt: '2024-01-02T09:00:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
    tags: ['content', 'planning'],
    subtasks: [
      { id: 's1', title: 'Review blog post schedule', completed: true },
      { id: 's2', title: 'Approve social media themes', completed: true },
      { id: 's3', title: 'Align with product team', completed: true },
    ],
    comments: [
      { id: 'c1', author: 'Sarah', content: 'Added the webinar series to the calendar.', createdAt: '2024-01-08T11:00:00Z' },
      { id: 'c2', author: 'Alex', content: 'Looks great! Approved.', createdAt: '2024-01-10T14:30:00Z' },
    ],
    linkedCampaign: 'Q1 Brand Awareness',
    estimatedHours: 4,
  },
  {
    id: '2',
    title: 'Launch LinkedIn retargeting campaign',
    description: 'Set up and launch retargeting campaign for pricing page visitors. Target users who viewed pricing but didn\'t convert in the last 14 days.',
    status: 'in_progress',
    priority: 'high',
    taskType: 'social_media',
    assignee: 'Sarah',
    assigneeIds: [{ id: '2', name: 'Sarah' }],
    startDate: '2024-01-15',
    dueDate: '2024-01-20',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-18T09:00:00Z',
    tags: ['ads', 'linkedin', 'retargeting'],
    subtasks: [
      { id: 's1', title: 'Create audience segment', completed: true },
      { id: 's2', title: 'Design ad creatives', completed: true },
      { id: 's3', title: 'Set up campaign in LinkedIn', completed: false },
      { id: 's4', title: 'Configure tracking pixels', completed: false },
    ],
    comments: [
      { id: 'c1', author: 'Alex', content: 'AI recommended this - high confidence score of 87%.', createdAt: '2024-01-15T10:30:00Z' },
    ],
    linkedCampaign: 'Q1 Brand Awareness',
    estimatedHours: 6,
    aiGenerated: true,
  },
  {
    id: '3',
    title: 'A/B test pricing page headline',
    description: 'Create and run A/B test on pricing page headline. Test value-focused copy vs. feature-focused copy based on heatmap insights.',
    status: 'in_progress',
    priority: 'medium',
    taskType: 'strategie',
    assignee: 'Alex',
    assigneeIds: [{ id: '1', name: 'Alex' }],
    startDate: '2024-01-14',
    dueDate: '2024-01-25',
    createdAt: '2024-01-14T16:45:00Z',
    updatedAt: '2024-01-17T11:00:00Z',
    tags: ['conversion', 'testing', 'website'],
    subtasks: [
      { id: 's1', title: 'Draft headline variants', completed: true },
      { id: 's2', title: 'Set up A/B test in Optimizely', completed: false },
      { id: 's3', title: 'Define success metrics', completed: true },
    ],
    comments: [],
    estimatedHours: 3,
    aiGenerated: true,
  },
  {
    id: '4',
    title: 'Create case study draft',
    description: 'Write first draft of Alsbom case study. Focus on 3x ROI achieved and implementation timeline. Include quotes from customer.',
    status: 'backlog',
    priority: 'medium',
    taskType: 'contenu',
    assignee: 'Mike',
    assigneeIds: [{ id: '3', name: 'Mike' }],
    startDate: null,
    dueDate: '2024-02-01',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
    tags: ['content', 'case-study', 'sales-enablement'],
    subtasks: [
      { id: 's1', title: 'Interview customer', completed: false },
      { id: 's2', title: 'Gather metrics and data', completed: false },
      { id: 's3', title: 'Write first draft', completed: false },
      { id: 's4', title: 'Design layout', completed: false },
    ],
    comments: [],
    estimatedHours: 8,
  },
  {
    id: '5',
    title: 'Optimize blog for SEO keywords',
    description: 'Optimize existing blog content for "AI marketing tools" keyword cluster. Update meta descriptions, headers, and internal links.',
    status: 'backlog',
    priority: 'high',
    taskType: 'seo',
    assignee: null,
    assigneeIds: [],
    startDate: null,
    dueDate: '2024-01-28',
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    tags: ['seo', 'content', 'optimization'],
    subtasks: [
      { id: 's1', title: 'Identify top 5 pages to optimize', completed: false },
      { id: 's2', title: 'Update meta descriptions', completed: false },
      { id: 's3', title: 'Add internal links', completed: false },
      { id: 's4', title: 'Optimize images with alt text', completed: false },
    ],
    comments: [
      { id: 'c1', author: 'AI', content: 'Keyword gap analysis shows opportunity to rank for 12 high-volume terms. Search volume: 14,800/month.', createdAt: '2024-01-15T09:15:00Z' },
    ],
    estimatedHours: 5,
    aiGenerated: true,
  },
  {
    id: '6',
    title: 'Update email sequences',
    description: 'Review and update nurture email sequences. Add 2 new emails to the win-back sequence based on latest engagement data.',
    status: 'review',
    priority: 'low',
    taskType: 'contenu',
    assignee: 'Sarah',
    assigneeIds: [{ id: '2', name: 'Sarah' }],
    startDate: '2024-01-10',
    dueDate: '2024-01-22',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-19T15:00:00Z',
    tags: ['email', 'automation', 'nurture'],
    subtasks: [
      { id: 's1', title: 'Audit current sequences', completed: true },
      { id: 's2', title: 'Write new email copy', completed: true },
      { id: 's3', title: 'Set up in HubSpot', completed: true },
      { id: 's4', title: 'QA and test', completed: false },
    ],
    comments: [
      { id: 'c1', author: 'Sarah', content: 'Ready for review. Added 2 new win-back emails.', createdAt: '2024-01-19T15:00:00Z' },
    ],
    linkedCampaign: 'Webinar Series - Marketing Trends',
    estimatedHours: 4,
  },
];

export const taskColumns = [
  { id: 'backlog' as TaskStatus, title: 'Backlog', color: 'bg-muted' },
  { id: 'in_progress' as TaskStatus, title: 'En cours', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'review' as TaskStatus, title: 'En revue', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'done' as TaskStatus, title: 'Terminé', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
];

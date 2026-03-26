// Task types for DigiObs Plan

export type TaskStatus = 'backlog' | 'doing' | 'review' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

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
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  linkedCampaign?: string;
  estimatedHours?: number;
  aiGenerated?: boolean;
  // Content Creator linking
  linkedContentId?: string;
  linkedContentType?: 'opportunity' | 'content-item';
  sourceModule?: 'content-creator' | 'insights' | 'followup';
  // Wrike linkage
  wrikeTaskId?: string;
  wrikeStepId?: string;
  wrikeProjectId?: string;
  wrikePermalink?: string;
}

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review Q1 content calendar',
    description: 'Review and approve the Q1 content calendar including blog posts, social media, and email campaigns. Ensure alignment with product launch timeline.',
    status: 'done',
    priority: 'high',
    assignee: 'Alex',
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
    status: 'doing',
    priority: 'high',
    assignee: 'Sarah',
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
    status: 'doing',
    priority: 'medium',
    assignee: 'Alex',
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
    assignee: 'Mike',
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
    assignee: null,
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
    assignee: 'Sarah',
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
  { id: 'doing' as TaskStatus, title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'review' as TaskStatus, title: 'Review', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'done' as TaskStatus, title: 'Done', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
];

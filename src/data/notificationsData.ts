// Mock Notifications Data for DigiObs

import { Notification, NotificationPreferences, defaultNotificationPreferences } from '@/types/notifications';

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'ai_recommendation',
    title: 'Launch LinkedIn retargeting campaign',
    message: 'Website visitors who viewed pricing page show 3x higher intent signals. Estimated 35+ qualified leads.',
    priority: 'high',
    status: 'unread',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    actionUrl: '/plan',
    actionLabel: 'Create Task',
    metadata: {
      confidence: 87,
      impact: 'high',
      category: 'Acquisition',
    },
  },
  {
    id: 'n2',
    type: 'ai_alert',
    title: 'Unusual traffic drop detected',
    message: 'Organic traffic dropped 23% in the last 2 hours. Investigating potential causes.',
    priority: 'high',
    status: 'unread',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    actionUrl: '/reporting',
    actionLabel: 'View Report',
    metadata: {
      source: 'Analytics Agent',
    },
  },
  {
    id: 'n3',
    type: 'lead',
    title: 'Hot lead requires attention',
    message: 'Sarah Chen from Innovate Corp (Score: 92) has been waiting 48h for follow-up.',
    priority: 'high',
    status: 'unread',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    actionUrl: '/prospects',
    actionLabel: 'View Lead',
    metadata: {
      category: 'Sales',
    },
  },
  {
    id: 'n4',
    type: 'ai_recommendation',
    title: 'Optimize blog for "AI marketing tools"',
    message: 'Keyword gap analysis shows opportunity to rank for 12 high-volume terms.',
    priority: 'high',
    status: 'unread',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    actionUrl: '/plan',
    actionLabel: 'Create Task',
    metadata: {
      confidence: 92,
      impact: 'high',
      category: 'SEO',
    },
  },
  {
    id: 'n5',
    type: 'insight',
    title: 'Competitor launched AI feature',
    message: 'MarketForce announced AI-powered campaign optimization. May impact positioning.',
    priority: 'medium',
    status: 'read',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    actionUrl: '/insights',
    actionLabel: 'View Insight',
    metadata: {
      source: 'Competitive Intelligence',
      category: 'Competitor',
    },
  },
  {
    id: 'n6',
    type: 'campaign',
    title: 'Q1 Brand Awareness hitting targets',
    message: 'Campaign is 56% through budget with 127 leads generated. On track for goals.',
    priority: 'low',
    status: 'read',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    actionUrl: '/reporting',
    actionLabel: 'View Campaign',
    metadata: {
      category: 'Performance',
    },
  },
  {
    id: 'n7',
    type: 'ai_recommendation',
    title: 'A/B test pricing page headline',
    message: 'Heatmap data shows 67% of users don\'t scroll past the fold.',
    priority: 'medium',
    status: 'read',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    actionUrl: '/plan',
    actionLabel: 'Create Task',
    metadata: {
      confidence: 78,
      impact: 'medium',
      category: 'Conversion',
    },
  },
  {
    id: 'n8',
    type: 'integration',
    title: 'Google Ads connection restored',
    message: 'The Google Ads integration is back online after authentication refresh.',
    priority: 'low',
    status: 'read',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    actionUrl: '/admin',
    actionLabel: 'View Integrations',
    metadata: {
      source: 'System',
    },
  },
  {
    id: 'n9',
    type: 'system',
    title: 'Weekly report ready',
    message: 'Your automated weekly performance report has been generated.',
    priority: 'low',
    status: 'read',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    actionUrl: '/reporting',
    actionLabel: 'View Report',
  },
  {
    id: 'n10',
    type: 'ai_alert',
    title: 'Budget pacing warning',
    message: 'LinkedIn Ads spend is 15% above daily target. May exhaust budget 5 days early.',
    priority: 'medium',
    status: 'read',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    actionUrl: '/reporting',
    actionLabel: 'View Details',
    metadata: {
      source: 'Budget Agent',
      category: 'Budget',
    },
  },
];

// Initial preferences (can be persisted)
export let userNotificationPreferences: NotificationPreferences = { ...defaultNotificationPreferences };

export const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) => {
  userNotificationPreferences = { ...userNotificationPreferences, ...updates };
};

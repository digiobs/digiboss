// Notification Types for DigiObs

export type NotificationType = 
  | 'ai_recommendation'
  | 'ai_alert'
  | 'system'
  | 'insight'
  | 'lead'
  | 'campaign'
  | 'integration';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    confidence?: number;
    impact?: 'high' | 'medium' | 'low';
    source?: string;
    category?: string;
  };
}

export interface NotificationPreferences {
  // AI Notifications
  aiRecommendations: boolean;
  aiAlerts: boolean;
  aiDigest: boolean;
  
  // Channel Preferences
  inAppNotifications: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  
  // Frequency Settings
  digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Filter Settings
  minPriority: NotificationPriority;
  enabledTypes: NotificationType[];
}

export const defaultNotificationPreferences: NotificationPreferences = {
  aiRecommendations: true,
  aiAlerts: true,
  aiDigest: true,
  inAppNotifications: true,
  emailNotifications: true,
  slackNotifications: false,
  digestFrequency: 'daily',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  minPriority: 'low',
  enabledTypes: ['ai_recommendation', 'ai_alert', 'system', 'insight', 'lead', 'campaign', 'integration'],
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  ai_recommendation: 'AI Recommendations',
  ai_alert: 'AI Alerts',
  system: 'System Updates',
  insight: 'Insights',
  lead: 'Lead Activity',
  campaign: 'Campaign Updates',
  integration: 'Integration Alerts',
};

export const notificationTypeIcons: Record<NotificationType, string> = {
  ai_recommendation: 'Sparkles',
  ai_alert: 'AlertTriangle',
  system: 'Settings',
  insight: 'Lightbulb',
  lead: 'Users',
  campaign: 'Megaphone',
  integration: 'Link',
};

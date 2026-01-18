import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Notification, NotificationPreferences, NotificationStatus, NotificationType } from '@/types/notifications';
import { mockNotifications, userNotificationPreferences, updateNotificationPreferences } from '@/data/notificationsData';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>(userNotificationPreferences);

  // Get unread count
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  // Get high priority unread count
  const highPriorityUnreadCount = notifications.filter(
    (n) => n.status === 'unread' && n.priority === 'high'
  ).length;

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(notification);
    return acc;
  }, {} as Record<NotificationType, Notification[]>);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' as NotificationStatus } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'read' as NotificationStatus }))
    );
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'dismissed' as NotificationStatus } : n))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'dismissed' as NotificationStatus }))
    );
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, ...updates };
      updateNotificationPreferences(updates);
      return newPrefs;
    });
    toast.success('Notification preferences updated');
  }, []);

  // Add a new notification (for real-time simulation)
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `n${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'unread',
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Show toast for high priority notifications
    if (notification.priority === 'high' && preferences.inAppNotifications) {
      const typeLabel = notification.type === 'ai_recommendation' ? '🤖 AI Recommendation' :
                        notification.type === 'ai_alert' ? '⚠️ AI Alert' :
                        notification.type === 'lead' ? '👤 Lead Alert' :
                        '🔔 Notification';
      
      toast(typeLabel, {
        description: notification.title,
        action: notification.actionUrl ? {
          label: notification.actionLabel || 'View',
          onClick: () => window.location.href = notification.actionUrl!,
        } : undefined,
        duration: 8000,
      });
    }

    return newNotification;
  }, [preferences.inAppNotifications]);

  // Simulate real-time notifications
  useEffect(() => {
    if (!preferences.aiAlerts) return;

    const simulateNotification = () => {
      const randomNotifications: Omit<Notification, 'id' | 'createdAt' | 'status'>[] = [
        {
          type: 'ai_alert',
          title: 'Conversion rate spike detected',
          message: 'Landing page A is converting 40% better than yesterday.',
          priority: 'medium',
          actionUrl: '/reporting',
          actionLabel: 'View Details',
          metadata: { source: 'Analytics Agent' },
        },
        {
          type: 'ai_recommendation',
          title: 'New keyword opportunity found',
          message: 'Rising search term in your industry with low competition.',
          priority: 'medium',
          actionUrl: '/insights',
          actionLabel: 'Explore',
          metadata: { confidence: 75, impact: 'medium', category: 'SEO' },
        },
        {
          type: 'lead',
          title: 'Lead opened proposal',
          message: 'David Kim from NextGen Solutions viewed your proposal.',
          priority: 'high',
          actionUrl: '/prospects',
          actionLabel: 'Follow Up',
          metadata: { category: 'Sales' },
        },
      ];

      const notification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
      addNotification(notification);
    };

    // Simulate a notification every 45-90 seconds for demo
    const interval = setInterval(simulateNotification, 45000 + Math.random() * 45000);

    return () => clearInterval(interval);
  }, [preferences.aiAlerts, addNotification]);

  // Get filtered notifications (excluding dismissed)
  const visibleNotifications = notifications.filter((n) => n.status !== 'dismissed');

  return {
    notifications: visibleNotifications,
    groupedNotifications,
    unreadCount,
    highPriorityUnreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    updatePreferences,
    addNotification,
  };
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Settings,
  Lightbulb,
  Users,
  Megaphone,
  Link,
  Check,
  CheckCheck,
  X,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Notification, NotificationType } from '@/types/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  ai_recommendation: <Sparkles className="w-4 h-4" />,
  ai_alert: <AlertTriangle className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
  lead: <Users className="w-4 h-4" />,
  campaign: <Megaphone className="w-4 h-4" />,
  integration: <Link className="w-4 h-4" />,
};

const typeColors: Record<NotificationType, string> = {
  ai_recommendation: 'bg-primary/10 text-primary',
  ai_alert: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  system: 'bg-muted text-muted-foreground',
  insight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  lead: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  campaign: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  integration: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const priorityColors: Record<string, string> = {
  high: 'border-l-destructive',
  medium: 'border-l-amber-500',
  low: 'border-l-muted-foreground/30',
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction?: () => void;
}

function NotificationItem({ notification, onRead, onDismiss, onAction }: NotificationItemProps) {
  const navigate = useNavigate();
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    onRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onAction?.();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'group relative p-3 border-l-2 transition-all cursor-pointer hover:bg-muted/50',
        priorityColors[notification.priority],
        isUnread ? 'bg-primary/5' : 'bg-transparent'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeColors[notification.type])}>
          {typeIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm line-clamp-1', isUnread ? 'font-semibold' : 'font-medium')}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                  }}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {notification.metadata?.confidence && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {notification.metadata.confidence}% confidence
              </Badge>
            )}
            {notification.metadata?.impact && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px] h-4 px-1.5',
                  notification.metadata.impact === 'high' ? 'impact-high' :
                  notification.metadata.impact === 'medium' ? 'impact-medium' : 'impact-low'
                )}
              >
                {notification.metadata.impact} impact
              </Badge>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {isUnread && (
          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  onOpenPreferences: () => void;
}

export function NotificationCenter({ onOpenPreferences }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    highPriorityUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  const aiNotifications = notifications.filter(
    (n) => n.type === 'ai_recommendation' || n.type === 'ai_alert'
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== 'ai_recommendation' && n.type !== 'ai_alert'
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 text-[10px] font-medium rounded-full flex items-center justify-center',
                highPriorityUnreadCount > 0
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unreadCount} unread • {highPriorityUnreadCount} high priority
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                markAllAsRead();
              }}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setOpen(false);
                onOpenPreferences();
              }}
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start gap-1 px-4 pt-2 bg-transparent h-auto">
            <TabsTrigger value="all" className="text-xs h-7 px-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs h-7 px-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              AI ({aiNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs h-7 px-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Activity ({otherNotifications.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="all" className="m-0 divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">No notifications to show</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDismiss={dismissNotification}
                    onAction={() => setOpen(false)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="ai" className="m-0 divide-y divide-border">
              {aiNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No AI notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">DigiObs AI will alert you here</p>
                </div>
              ) : (
                aiNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDismiss={dismissNotification}
                    onAction={() => setOpen(false)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="activity" className="m-0 divide-y divide-border">
              {otherNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No activity</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">System and activity alerts appear here</p>
                </div>
              ) : (
                otherNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDismiss={dismissNotification}
                    onAction={() => setOpen(false)}
                  />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-primary"
            onClick={() => {
              setOpen(false);
              onOpenPreferences();
            }}
          >
            Notification Settings
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

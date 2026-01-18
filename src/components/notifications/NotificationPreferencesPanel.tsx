import { useState } from 'react';
import {
  Bell,
  Sparkles,
  Mail,
  MessageSquare,
  Clock,
  Moon,
  Filter,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationPreferences, NotificationType, notificationTypeLabels } from '@/types/notifications';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPreferencesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesPanel({ open, onOpenChange }: NotificationPreferencesPanelProps) {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);

  const handleSave = () => {
    updatePreferences(localPrefs);
    onOpenChange(false);
  };

  const toggleNotificationType = (type: NotificationType) => {
    const current = localPrefs.enabledTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setLocalPrefs({ ...localPrefs, enabledTypes: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how and when you receive notifications from DigiObs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-medium">AI Notifications</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-recommendations" className="font-medium">AI Recommendations</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get notified when AI suggests new actions
                  </p>
                </div>
                <Switch
                  id="ai-recommendations"
                  checked={localPrefs.aiRecommendations}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, aiRecommendations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-alerts" className="font-medium">AI Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get alerted about anomalies and urgent issues
                  </p>
                </div>
                <Switch
                  id="ai-alerts"
                  checked={localPrefs.aiAlerts}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, aiAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-digest" className="font-medium">AI Weekly Digest</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Summary of AI insights and actions
                  </p>
                </div>
                <Switch
                  id="ai-digest"
                  checked={localPrefs.aiDigest}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, aiDigest: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Channels */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Delivery Channels</h3>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="in-app" className="font-medium">In-App Notifications</Label>
                </div>
                <Switch
                  id="in-app"
                  checked={localPrefs.inAppNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, inAppNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="email" className="font-medium">Email Notifications</Label>
                </div>
                <Switch
                  id="email"
                  checked={localPrefs.emailNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="slack" className="font-medium">Slack Notifications</Label>
                </div>
                <Switch
                  id="slack"
                  checked={localPrefs.slackNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, slackNotifications: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Frequency */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Digest Frequency</h3>
            </div>

            <div className="pl-6">
              <RadioGroup
                value={localPrefs.digestFrequency}
                onValueChange={(value) =>
                  setLocalPrefs({
                    ...localPrefs,
                    digestFrequency: value as NotificationPreferences['digestFrequency'],
                  })
                }
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="realtime" id="realtime" />
                  <Label htmlFor="realtime" className="text-sm">Real-time</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly" className="text-sm">Hourly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="text-sm">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="text-sm">Weekly</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Quiet Hours</h3>
              </div>
              <Switch
                checked={localPrefs.quietHoursEnabled}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, quietHoursEnabled: checked })
                }
              />
            </div>

            {localPrefs.quietHoursEnabled && (
              <div className="pl-6 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">From</Label>
                  <Select
                    value={localPrefs.quietHoursStart}
                    onValueChange={(value) =>
                      setLocalPrefs({ ...localPrefs, quietHoursStart: value })
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">To</Label>
                  <Select
                    value={localPrefs.quietHoursEnd}
                    onValueChange={(value) =>
                      setLocalPrefs({ ...localPrefs, quietHoursEnd: value })
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Priority Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Minimum Priority</h3>
            </div>

            <div className="pl-6">
              <Select
                value={localPrefs.minPriority}
                onValueChange={(value) =>
                  setLocalPrefs({
                    ...localPrefs,
                    minPriority: value as NotificationPreferences['minPriority'],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">All notifications (Low and above)</SelectItem>
                  <SelectItem value="medium">Medium and High only</SelectItem>
                  <SelectItem value="high">High priority only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Notification Types</h3>
            </div>

            <div className="pl-6 space-y-2">
              {(Object.keys(notificationTypeLabels) as NotificationType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={localPrefs.enabledTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={type} className="text-sm font-normal">
                    {notificationTypeLabels[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

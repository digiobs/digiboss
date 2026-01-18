import { useState } from 'react';
import { Search, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel';

const dateRangeLabels: Record<string, string> = {
  '7d': 'Last 7 days',
  '14d': 'Last 14 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'ytd': 'Year to date',
};

export function TopBar() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  return (
    <>
      <header className="fixed top-0 left-64 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search anything..."
              className="pl-10 bg-muted/50 border-transparent focus:border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Right side - Date, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 h-9">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>

          {/* Notification Center */}
          <NotificationCenter onOpenPreferences={() => setPreferencesOpen(true)} />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">Alex Morgan</p>
                  <p className="text-xs text-muted-foreground">Marketing Manager</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPreferencesOpen(true)}>
                Notification Preferences
              </DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Notification Preferences Modal */}
      <NotificationPreferencesPanel
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </>
  );
}

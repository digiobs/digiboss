import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, User, LogOut } from 'lucide-react';
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
import { useDateRange } from '@/contexts/DateRangeContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function TopBar() {
  const navigate = useNavigate();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { dateRange, setDateRange } = useDateRange();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

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
                  <p className="font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPreferencesOpen(true)}>
                Notification Preferences
              </DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
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

import { Search, Bell, Calendar, User } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { recommendations } from '@/data/mockData';

export function TopBar() {
  const newRecommendations = recommendations.filter((r) => r.status === 'new').length;

  return (
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
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Last 7 days</span>
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {newRecommendations > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {newRecommendations}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 border-b border-border">
              <h4 className="font-semibold text-sm">AI Recommendations</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {newRecommendations} new actions suggested
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recommendations.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-2">{rec.title}</p>
                    <Badge
                      variant="secondary"
                      className={
                        rec.impact === 'high'
                          ? 'impact-high'
                          : rec.impact === 'medium'
                          ? 'impact-medium'
                          : 'impact-low'
                      }
                    >
                      {rec.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rec.confidence}% confidence
                  </p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-primary">
                View all recommendations
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

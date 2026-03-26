import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  Newspaper,
  Users,
  Calendar,
  PenTool,
  BookOpen,
  FolderOpen,
  BarChart3,
  FileCheck,
  MessageSquare,
  Settings,
  ChevronDown,
  Building2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';

const colorClasses: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
};

const navItems = [
  { path: '/home', icon: LayoutDashboard, label: 'Home' },
  { path: '/meetings', icon: Lightbulb, label: 'Meetings' },
  { path: '/meetings?view=veille', icon: Newspaper, label: 'Veille' },
  { path: '/prospects', icon: Users, label: 'Prospects' },
  { path: '/plan', icon: Calendar, label: 'Plan' },
  { path: '/content', icon: PenTool, label: 'Content Creator' },
  { path: '/contenus', icon: BookOpen, label: 'Contenus' },
  { path: '/assets', icon: FolderOpen, label: 'Assets' },
  { path: '/reporting', icon: BarChart3, label: 'Reporting' },
  { path: '/deliverables', icon: FileCheck, label: 'Livrables' },
  { path: '/chat', icon: MessageSquare, label: 'Talk to DigiObs' },
];

const bottomNavItems = [
  { path: '/admin', icon: Settings, label: 'Admin' },
];

export function Sidebar() {
  const location = useLocation();
  const { clients, currentClient, setCurrentClient, isLoading } = useClient();

  const getColorClass = (color: string) => colorClasses[color] || 'bg-blue-500';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo & Client Selector */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">D</span>
          </div>
          <span className="text-sidebar-foreground font-semibold text-lg">DigiObs</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm hover:bg-sidebar-accent/80 transition-colors">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentClient ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded ${getColorClass(currentClient.color)} flex items-center justify-center shrink-0`}>
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <span className="truncate">{currentClient.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select client</span>
            )}
            <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-0">
            <ScrollArea className="max-h-[400px]">
              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => setCurrentClient(ALL_CLIENTS_CLIENT)}
                  className={cn(
                    'flex items-center gap-2',
                    currentClient?.id === ALL_CLIENTS_ID && 'bg-accent'
                  )}
                >
                  <div className="w-5 h-5 rounded bg-slate-500 flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="truncate">All clients</span>
                </DropdownMenuItem>
                {clients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => setCurrentClient(client)}
                    className={cn(
                      'flex items-center gap-2',
                      client.id === currentClient?.id && 'bg-accent'
                    )}
                  >
                    <div className={`w-5 h-5 rounded ${getColorClass(client.color)} flex items-center justify-center shrink-0`}>
                      <Building2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="truncate">{client.name}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isVeilleLink = item.path.startsWith('/meetings?view=veille');
          const isActive = isVeilleLink
            ? location.pathname === '/meetings' && new URLSearchParams(location.search).get('view') === 'veille'
            : location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'nav-link',
                isActive && 'active'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'nav-link',
                isActive && 'active'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

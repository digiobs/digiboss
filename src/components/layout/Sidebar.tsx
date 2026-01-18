import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  Calendar,
  FolderOpen,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { workspaces } from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/prospects', icon: Users, label: 'Prospects' },
  { path: '/plan', icon: Calendar, label: 'Plan' },
  { path: '/assets', icon: FolderOpen, label: 'Assets' },
  { path: '/reporting', icon: BarChart3, label: 'Reporting' },
  { path: '/chat', icon: MessageSquare, label: 'Talk to DigiObs' },
];

const bottomNavItems = [
  { path: '/admin', icon: Settings, label: 'Admin' },
];

export function Sidebar() {
  const location = useLocation();
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo & Workspace Selector */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">D</span>
          </div>
          <span className="text-sidebar-foreground font-semibold text-lg">DigiObs</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm hover:bg-sidebar-accent/80 transition-colors">
            <span className="truncate">{currentWorkspace.name}</span>
            <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setCurrentWorkspace(workspace)}
                className={cn(
                  workspace.id === currentWorkspace.id && 'bg-accent'
                )}
              >
                {workspace.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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

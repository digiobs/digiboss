import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Lightbulb,
  Newspaper,
  Users,
  FolderOpen,
  BarChart3,
  ScrollText,
  MessageSquare,
  Settings,
  Plug,
  Sparkles,
  CalendarDays,
  CheckSquare,
  Activity,
  ChevronDown,
  Building2,
  Loader2,
  Search,
  Check,
  Briefcase,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';

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
  { path: '/veille', icon: Newspaper, label: 'Veille' },
  { path: '/prospects', icon: Users, label: 'Prospects' },
  { path: '/assets', icon: FolderOpen, label: 'Assets' },
  { path: '/proposals', icon: Sparkles, label: 'Propositions' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendrier' },
  { path: '/actions', icon: CheckSquare, label: 'Actions' },
  { path: '/seo-geo', icon: Search, label: 'SEO / GEO' },
  { path: '/kpis', icon: Activity, label: 'KPIs' },
  { path: '/reporting', icon: BarChart3, label: 'Reporting' },
  { path: '/journal', icon: ScrollText, label: 'Journal' },
  { path: '/chat', icon: MessageSquare, label: 'Talk to DigiObs' },
];

const bottomNavItems = [
  { path: '/admin/my-work', icon: Briefcase, label: 'Mon travail' },
  { path: '/settings/profile', icon: UserCog, label: 'Mon profil' },
  { path: '/settings/integrations', icon: Plug, label: 'Intégrations' },
  { path: '/admin', icon: Settings, label: 'Admin' },
];

export function Sidebar() {
  const location = useLocation();
  const { clients, currentClient, setCurrentClient, isLoading, isAdminUser } = useClient();
  const { isAdmin } = useVisibilityMode();
  const showAllClientsOption = isAdmin && isAdminUser;
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  const getColorClass = (color: string) => colorClasses[color ?? 'blue'] || 'bg-blue-500';

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
    [clients],
  );

  const handleSelectClient = (client: typeof ALL_CLIENTS_CLIENT | (typeof clients)[number]) => {
    setCurrentClient(client);
    setClientPickerOpen(false);
  };

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

        <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
          <PopoverTrigger
            aria-label="Sélectionner un client"
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm hover:bg-sidebar-accent/80 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentClient ? (
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded ${getColorClass(currentClient.color)} flex items-center justify-center shrink-0`}
                >
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <span className="truncate">{currentClient.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select client</span>
            )}
            <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-[--radix-popover-trigger-width] min-w-[240px] p-0"
          >
            <Command
              filter={(value, search) =>
                value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
              }
            >
              <CommandInput placeholder="Rechercher un client..." className="h-9" />
              <CommandList className="max-h-[60vh]">
                <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                {showAllClientsOption && (
                  <>
                    <CommandGroup heading="Admin">
                      <CommandItem
                        value="admin all clients"
                        onSelect={() => handleSelectClient(ALL_CLIENTS_CLIENT)}
                        className="flex items-center gap-2"
                      >
                        <div className="w-5 h-5 rounded bg-slate-500 flex items-center justify-center shrink-0">
                          <Building2 className="w-3 h-3 text-white" />
                        </div>
                        <span className="flex-1">Admin (all clients)</span>
                        {currentClient?.id === ALL_CLIENTS_ID && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandGroup heading={`Clients (${sortedClients.length})`}>
                  {sortedClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`${client.name} ${client.id}`}
                      onSelect={() => handleSelectClient(client)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-5 h-5 rounded ${getColorClass(client.color)} flex items-center justify-center shrink-0`}
                      >
                        <Building2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="flex-1 break-words">{client.name}</span>
                      {client.id === currentClient?.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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

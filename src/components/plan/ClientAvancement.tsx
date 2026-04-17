import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientAvancement, AvancementTask, AvancementKPIs, TeamMember } from '@/hooks/useClientAvancement';
import { cn } from '@/lib/utils';

interface Props {
  clientId: string | undefined;
}

// ── Helpers ──

function formatDateFR(d: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function monthLabel(d: string): string {
  const date = new Date(d);
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function overdueLabel(task: AvancementTask): string {
  if (task.overdue_days > 90) {
    const months = (task.overdue_days / 30).toFixed(1).replace('.0', '');
    return `RETARD : ${months} MOIS`;
  }
  if (task.overdue_days > 45) {
    const months = (task.overdue_days / 30).toFixed(1).replace('.0', '');
    return `RETARD : ${months} MOIS`;
  }
  return `RETARD : ${task.overdue_days} JOURS`;
}

function resourceIcon(type: string): string {
  switch (type) {
    case 'figma': return '🎨';
    case 'gdocs': case 'gdocs_en': case 'gdocs_fr': return '📄';
    case 'page': return '🌐';
    default: return '🔗';
  }
}

// ── Sub-components ──

function KPICard({ value, label, color }: { value: number; label: string; color: string }) {
  const borderColor = {
    green: 'border-t-emerald-500',
    red: 'border-t-red-500',
    blue: 'border-t-blue-500',
    purple: 'border-t-purple-500',
  }[color] || 'border-t-gray-400';
  const textColor = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  }[color] || 'text-gray-600';

  return (
    <div className={cn('bg-white rounded-xl border border-dashed border-gray-300 border-t-4 p-5 text-center', borderColor)}>
      <div className={cn('text-4xl font-bold', textColor)}>{value}</div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ kpis }: { kpis: AvancementKPIs }) {
  const total = kpis.total_count || 1;
  const pCompleted = (kpis.completed_count / total) * 100;
  const pOnTrack = ((kpis.active_count - kpis.overdue_count) / total) * 100;
  const pOverdue = (kpis.overdue_count / total) * 100;
  const pDeferred = (kpis.deferred_count / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-foreground">Avancement global</span>
        <span className="text-sm text-muted-foreground">
          {kpis.completed_count} / {kpis.total_count} tâches ({kpis.completion_pct}%)
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
        <div className="bg-emerald-500 h-full" style={{ width: `${pCompleted}%` }} />
        <div className="bg-blue-500 h-full" style={{ width: `${pOnTrack}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${pOverdue}%` }} />
        <div className="bg-purple-500 h-full" style={{ width: `${pDeferred}%` }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Terminées</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> En cours</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> En retard</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Différées</span>
      </div>
    </div>
  );
}

function SummaryGrid({ overdueTasks, completedTasks }: { overdueTasks: AvancementTask[]; completedTasks: AvancementTask[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">Points d'attention urgents</h3>
        <ul className="space-y-2">
          {overdueTasks.length === 0 && (
            <li className="text-sm text-muted-foreground">Aucun point d'attention</li>
          )}
          {overdueTasks.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-sm">
              <span className={cn(
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                t.overdue_days > 90 ? 'bg-red-500' : t.overdue_days > 30 ? 'bg-red-400' : 'bg-amber-500'
              )} />
              <span className="text-foreground">{t.title}{t.overdue_label ? ` : ${t.overdue_label} de retard` : ''}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">Réalisations récentes</h3>
        <ul className="space-y-2">
          {completedTasks.length === 0 && (
            <li className="text-sm text-muted-foreground">Aucune réalisation récente</li>
          )}
          {completedTasks.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-sm">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-500" />
              <span className="text-foreground">{t.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: AvancementTask }) {
  const borderColor =
    task.health_status === 'overdue' ? 'border-l-red-400' :
    task.health_status === 'completed' ? 'border-l-emerald-400' :
    task.health_status === 'deferred' ? 'border-l-purple-400' :
    task.importance === 'High' ? 'border-l-amber-400' :
    'border-l-blue-400';

  const bgColor = task.health_status === 'overdue' ? 'bg-red-50/50' : 'bg-white';

  return (
    <div className={cn('rounded-xl border border-l-4 p-4 space-y-2', borderColor, bgColor)}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-sm text-foreground">{task.title}</h4>
        {task.health_status === 'overdue' && (
          <span className="text-xs font-bold text-red-500 uppercase whitespace-nowrap shrink-0">
            {overdueLabel(task)}
          </span>
        )}
        {task.health_status === 'completed' && (
          <span className="text-xs font-medium text-emerald-600 whitespace-nowrap shrink-0">
            Terminée
          </span>
        )}
        {task.health_status === 'deferred' && (
          <span className="text-xs font-medium text-purple-600 whitespace-nowrap shrink-0">
            Différée
          </span>
        )}
        {task.health_status === 'on_track' && task.importance === 'High' && (
          <span className="text-xs font-medium text-amber-600 whitespace-nowrap shrink-0">
            Haute priorité
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {task.assignee && <span>{task.assignee}</span>}
        {(task.start_date || task.due_date) && (
          <span>
            {task.start_date ? formatDateFR(task.start_date) : '?'}
            {' → '}
            {task.due_date ? formatDateFR(task.due_date) : '?'}
          </span>
        )}
        {task.completed_at && (
          <span>Terminée le {formatDateFR(task.completed_at)}</span>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
      )}
      {task.resource_links && task.resource_links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {task.resource_links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full px-3 py-1 transition-colors"
            >
              {resourceIcon(link.type)} {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamTable({ team }: { team: TeamMember[] }) {
  if (team.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée d'équipe.</p>;
  }
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">Membre</th>
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">Tâches actives</th>
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">En retard</th>
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">En cours</th>
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr key={m.member} className="border-b last:border-b-0">
              <td className="px-4 py-2.5 font-medium">{m.member}</td>
              <td className="px-4 py-2.5">{m.total_tasks}</td>
              <td className={cn('px-4 py-2.5', m.overdue_tasks > 0 && 'text-red-500 font-semibold')}>
                {m.overdue_tasks}
              </td>
              <td className="px-4 py-2.5">{m.active_tasks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tabs ──

const TAB_CONFIG = [
  { key: 'overdue', label: 'En retard' },
  { key: 'ontrack', label: 'En cours' },
  { key: 'completed', label: 'Terminées' },
  { key: 'deferred', label: 'Différées' },
  { key: 'team', label: 'Charge équipe' },
] as const;

type TabKey = typeof TAB_CONFIG[number]['key'];

// ── Main Component ──

export function ClientAvancement({ clientId }: Props) {
  const { data, isLoading, error } = useClientAvancement(clientId);
  const [activeTab, setActiveTab] = useState<TabKey>('overdue');

  const { overdueTasks, onTrackTasks, completedTasks, deferredTasks } = useMemo(() => {
    if (!data) return { overdueTasks: [], onTrackTasks: [], completedTasks: [], deferredTasks: [] };
    return {
      overdueTasks: data.tasks.filter((t) => t.health_status === 'overdue').sort((a, b) => b.overdue_days - a.overdue_days),
      onTrackTasks: data.tasks.filter((t) => t.health_status === 'on_track'),
      completedTasks: data.tasks.filter((t) => t.health_status === 'completed').sort((a, b) => {
        if (!a.completed_at || !b.completed_at) return 0;
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      }),
      deferredTasks: data.tasks.filter((t) => t.health_status === 'deferred'),
    };
  }, [data]);

  // Group completed tasks by month
  const completedByMonth = useMemo(() => {
    const groups = new Map<string, AvancementTask[]>();
    completedTasks.forEach((t) => {
      const key = t.completed_at ? t.completed_at.substring(0, 7) : 'unknown';
      const arr = groups.get(key) || [];
      arr.push(t);
      groups.set(key, arr);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [completedTasks]);

  const tabCounts: Record<TabKey, number> = {
    overdue: overdueTasks.length,
    ontrack: onTrackTasks.length,
    completed: completedTasks.length,
    deferred: deferredTasks.length,
    team: data?.team.length || 0,
  };

  if (!clientId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sélectionnez un client pour voir l'avancement.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-10 rounded-full" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Erreur de chargement : {(error as Error).message}
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune tâche trouvée pour ce client.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={data.kpis.active_count} label="Tâches actives" color="green" />
        <KPICard value={data.kpis.overdue_count} label="En retard" color="red" />
        <KPICard value={data.kpis.completed_count} label="Terminées" color="blue" />
        <KPICard value={data.kpis.deferred_count} label="Différées" color="purple" />
      </div>

      {/* Progress Bar */}
      <ProgressBar kpis={data.kpis} />

      {/* Summary Grid */}
      <SummaryGrid overdueTasks={overdueTasks} completedTasks={completedTasks} />

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-0 overflow-x-auto">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label} ({tabCounts[tab.key]})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === 'overdue' && (
          overdueTasks.length === 0
            ? <p className="text-center py-8 text-muted-foreground">Aucune tâche en retard</p>
            : overdueTasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
        {activeTab === 'ontrack' && (
          onTrackTasks.length === 0
            ? <p className="text-center py-8 text-muted-foreground">Aucune tâche en cours</p>
            : onTrackTasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
        {activeTab === 'completed' && (
          completedTasks.length === 0
            ? <p className="text-center py-8 text-muted-foreground">Aucune tâche terminée</p>
            : completedByMonth.map(([month, tasks]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold text-foreground capitalize mb-2 mt-4 first:mt-0">
                    {month !== 'unknown' ? monthLabel(`${month}-01`) : 'Date inconnue'}
                  </h3>
                  {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
                </div>
              ))
        )}
        {activeTab === 'deferred' && (
          deferredTasks.length === 0
            ? <p className="text-center py-8 text-muted-foreground">Aucune tâche différée</p>
            : deferredTasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
        {activeTab === 'team' && <TeamTable team={data.team} />}
      </div>
    </div>
  );
}

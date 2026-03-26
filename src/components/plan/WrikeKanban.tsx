import { useState } from 'react';
import { WrikeTask } from '@/types/wrike';
import { WrikeTaskCard } from './WrikeTaskCard';
import { WrikeTaskDetail } from './WrikeTaskDetail';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WRIKE_CLIENTS } from '@/types/wrike';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Check if a task is overdue
const isOverdue = (task: WrikeTask): boolean => {
  if (!task.dates?.due) return false;
  const columnId = STATUS_COLUMN_MAP[task.status] || 'proposition';
  if (columnId === 'publie') return false; // Don't mark as overdue if already published
  const dueDate = new Date(task.dates.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

interface WrikeKanbanProps {
  tasks: WrikeTask[];
  isAdmin: boolean;
  isLoading: boolean;
  error?: string | null;
}

// Map Wrike status strings to kanban columns
const STATUS_COLUMN_MAP: Record<string, string> = {
  // Planning éditorial workflow
  "Proposition d'idée": 'proposition',
  "Proposition d'idées": 'proposition',
  // Default / Flux DigiObs
  'Idéation': 'proposition',
  'En cours de rédaction': 'redaction',
  'En cours de production': 'redaction',
  'A rédiger': 'redaction',
  'A maquetter': 'redaction',
  'A relire': 'validation',
  'À valider': 'validation',
  'En attente de validation': 'validation',
  'En attente client': 'validation',
  'À publier': 'publication',
  'Publié': 'publie',
  'Publié ce mois': 'publie',
  'Completed': 'publie',
};

const COLUMNS = [
  { id: 'proposition', label: "Proposition d'idée", colorClass: 'border-muted-foreground/30' },
  { id: 'redaction', label: 'En cours de rédaction', colorClass: 'border-primary/50' },
  { id: 'validation', label: 'À valider', colorClass: 'border-warning/50' },
  { id: 'publication', label: 'À publier', colorClass: 'border-accent-foreground/50' },
  { id: 'publie', label: 'Publié', colorClass: 'border-success/50' },
];

export function WrikeKanban({ tasks, isAdmin, isLoading, error }: WrikeKanbanProps) {
  const [selectedTask, setSelectedTask] = useState<WrikeTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>(() => {
    if (isAdmin) return 'all';
    const firstExternal = WRIKE_CLIENTS.find(c => c.sector !== 'internal');
    return firstExternal?.name ?? 'all';
  });
  const [canalFilter, setCanalFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique canals from tasks
  const uniqueCanals = [...new Set(tasks.map(t => t.canal).filter(Boolean))].sort();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (clientFilter !== 'all' && t.clientName !== clientFilter) return false;
    if (canalFilter !== 'all' && t.canal !== canalFilter) return false;
    if (priorityFilter !== 'all' && t.importance !== priorityFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group tasks by column and sort by due date (overdue first)
  const getColumnTasks = (columnId: string) => {
    const columnTasks = filteredTasks.filter((t) => {
      const mapped = STATUS_COLUMN_MAP[t.status] || 'proposition';
      return mapped === columnId;
    });

    // Sort: overdue first, then by due date ascending, then by title
    return columnTasks.sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);

      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1;
      }

      const aDue = a.dates?.due ? new Date(a.dates.due).getTime() : Infinity;
      const bDue = b.dates?.due ? new Date(b.dates.due).getTime() : Infinity;

      if (aDue !== bDue) {
        return aDue - bDue;
      }

      return a.title.localeCompare(b.title);
    });
  };

  const handleTaskClick = (task: WrikeTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive font-medium">Erreur de connexion Wrike</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            {isAdmin && <SelectItem value="all">Admin (tous les clients)</SelectItem>}
            {WRIKE_CLIENTS.filter(c => c.sector !== 'internal').map((c) => (
              <SelectItem key={c.wrikeId} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={canalFilter} onValueChange={setCanalFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les canaux</SelectItem>
            {uniqueCanals.map((c) => (
              <SelectItem key={c} value={c!}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="High">🔴 Haute</SelectItem>
            <SelectItem value="Normal">🟡 Normale</SelectItem>
            <SelectItem value="Low">🟢 Basse</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-xs">
          {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-5 gap-3 min-h-[500px]">
        {COLUMNS.map((col) => {
          const columnTasks = getColumnTasks(col.id);
          return (
            <div key={col.id} className={cn('flex flex-col rounded-lg border-t-2 bg-muted/30 p-2', col.colorClass)}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {col.label}
                </h3>
                <Badge variant="secondary" className="text-[10px] h-5 min-w-5 justify-center">
                  {columnTasks.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh] pr-1">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-28 w-full rounded-lg" />
                  </>
                ) : columnTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">Aucune tâche</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <WrikeTaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      isOverdue={isOverdue(task)}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task detail panel */}
      <WrikeTaskDetail
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isAdmin={isAdmin}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Search,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClient } from '@/contexts/ClientContext';
import { usePlanTasksList, type PlanTask } from '@/hooks/usePlanTasksList';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  review: { label: 'A valider', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ready: { label: 'A publier', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  done: { label: 'Termine', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  blocked: { label: 'Bloque', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: 'Haute', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: 'Moyenne', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  low: { label: 'Basse', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' };
}

function getPriorityConfig(priority: string) {
  return priorityConfig[priority] ?? priorityConfig.medium;
}

function isOverdue(task: PlanTask): boolean {
  if (!task.due_date || task.status === 'done') return false;
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export default function Plan() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { data: tasks = [], isLoading } = usePlanTasksList();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = tasks;
    if (selectedStatus !== 'all') {
      result = result.filter((t) => t.status === selectedStatus);
    }
    if (selectedPriority !== 'all') {
      result = result.filter((t) => t.priority === selectedPriority);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignee?.toLowerCase().includes(q) ||
          t.clients?.name?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, selectedStatus, selectedPriority, search]);

  // Stats
  const stats = useMemo(() => {
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter(isOverdue).length;
    const backlog = tasks.filter((t) => t.status === 'backlog').length;
    return { total: tasks.length, inProgress, overdue, backlog };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Plan</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {isAllClientsSelected
            ? 'Toutes les taches en cours — tous clients confondus.'
            : `Taches pour ${currentClient?.name ?? 'le client selectionne'}.`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-blue-500">En cours</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-red-500">En retard</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Backlog</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold">{stats.backlog}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priorite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorites</SelectItem>
            {Object.entries(priorityConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tache..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des taches...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune tache</h3>
          <p className="text-muted-foreground">
            {search ? 'Aucune tache ne correspond a votre recherche.' : 'Aucune tache pour cette selection.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[90px]">Echeance</TableHead>
                <TableHead>Tache</TableHead>
                <TableHead className="w-[110px]">Statut</TableHead>
                <TableHead className="w-[90px]">Priorite</TableHead>
                <TableHead className="w-[140px]">Client</TableHead>
                <TableHead className="w-[140px]">Assignee</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => {
                const st = getStatusConfig(task.status);
                const pr = getPriorityConfig(task.priority);
                const overdue = isOverdue(task);
                const isExpanded = expandedId === task.id;

                return (
                  <TableRow
                    key={task.id}
                    className={cn(
                      'cursor-pointer',
                      overdue && 'bg-red-50/50 dark:bg-red-950/20',
                      isExpanded && 'bg-muted/40'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  >
                    <TableCell className="text-sm">
                      {task.due_date ? (
                        <div className={cn('flex items-center gap-1', overdue && 'text-red-600 font-medium')}>
                          {overdue && <AlertTriangle className="w-3 h-3" />}
                          {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className={cn('font-medium text-foreground line-clamp-1', overdue && 'text-red-700 dark:text-red-400')}>
                          {task.title}
                        </span>
                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            {task.description && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {task.description}
                              </p>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={st.className}>
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={pr.className}>
                        {pr.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.clients?.name ?? task.client_id}
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground line-clamp-1">{task.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.wrike_permalink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a href={task.wrike_permalink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WRIKE_CLIENTS } from '@/types/wrike';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  GripVertical,
  Linkedin,
  FileText,
  Mail,
  Globe,
  BookOpen,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useEditorialCalendar, type CalendarEntry } from '@/hooks/useEditorialCalendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const canalIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  blog: BookOpen,
  newsletter: Mail,
  web: Globe,
  notion: FileText,
};

const statusColors: Record<string, string> = {
  idee: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  brouillon: 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200',
  valide: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  programme: 'bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200',
  publie: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200',
};

const priorityColors: Record<string, string> = {
  critique: 'border-l-red-500',
  urgent: 'border-l-orange-500',
  important: 'border-l-blue-400',
  normal: 'border-l-slate-300',
};

function EntryChip({
  entry,
  onClick,
  draggable,
  onDragStart,
}: {
  entry: CalendarEntry;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const CanalIcon = canalIcons[entry.canal] || FileText;
  const statusColor = statusColors[entry.status] || statusColors.idee;

  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer border-l-2 bg-card hover:bg-accent/50 transition-colors mb-1',
        priorityColors[entry.priority] || priorityColors.normal
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {draggable && (
        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 cursor-grab" />
      )}
      <CanalIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
      <span className="truncate flex-1 font-medium">{entry.title}</span>
      <Badge className={cn('text-[10px] px-1 py-0', statusColor)}>{entry.status}</Badge>
    </div>
  );
}

function EntryDetailDialog({
  entry,
  open,
  onOpenChange,
  onStatusChange,
  isAdmin,
}: {
  entry: CalendarEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  isAdmin: boolean;
}) {
  if (!entry) return null;
  const CanalIcon = canalIcons[entry.canal] || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CanalIcon className="w-5 h-5" />
            {entry.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-medium">{format(parseISO(entry.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Canal</p>
              <p className="font-medium capitalize">{entry.canal}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Type</p>
              <p className="font-medium">{entry.content_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Priorité</p>
              <p className="font-medium capitalize">{entry.priority}</p>
            </div>
          </div>
          {entry.pilier && (
            <div>
              <p className="text-muted-foreground text-xs">Pilier</p>
              <p>{entry.pilier}</p>
            </div>
          )}
          {entry.serie_id && (
            <div>
              <p className="text-muted-foreground text-xs">Série</p>
              <p>{entry.serie_id} · Épisode {entry.serie_episode}/{entry.serie_total}</p>
            </div>
          )}
          {entry.draft_content && (
            <div>
              <p className="text-muted-foreground text-xs">Brouillon</p>
              <div className="text-sm text-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto bg-accent/30 rounded p-2 border border-border/50">
                {entry.draft_content}
              </div>
            </div>
          )}
          {entry.notes && (
            <div>
              <p className="text-muted-foreground text-xs">Notes</p>
              <p className="text-muted-foreground">{entry.notes}</p>
            </div>
          )}
          {entry.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {entry.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">{String(tag)}</Badge>
              ))}
            </div>
          )}
          {isAdmin && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground text-xs mb-2">Changer le statut</p>
              <div className="flex gap-2 flex-wrap">
                {['idee', 'brouillon', 'valide', 'programme', 'publie'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={entry.status === s ? 'default' : 'outline'}
                    className="text-xs capitalize"
                    onClick={() => onStatusChange(entry.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EditorialCalendar() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { entries, entriesByDate, stats, isLoading, moveEntry, updateEntryStatus, refetch } = useEditorialCalendar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterCanal, setFilterCanal] = useState<string>('all');
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const wrikeFolderId = useMemo(() => {
    if (!currentClient?.name) return null;
    const target = currentClient.name.trim().toLowerCase();
    return WRIKE_CLIENTS.find((c) => c.name.toLowerCase() === target)?.wrikeId ?? null;
  }, [currentClient?.name]);

  const handleWrikeImport = useCallback(async () => {
    if (!currentClient?.id) return;
    if (!wrikeFolderId) {
      toast.error('Aucun projet Wrike associé à ce client');
      return;
    }
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('wrike-editorial-import', {
        body: { clientId: currentClient.id, wrikeFolderId },
      });
      if (error) throw error;
      const imported = (data as { imported?: number } | null)?.imported ?? 0;
      toast.success(`${imported} publication${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''} depuis Wrike`);
      await refetch();
    } catch (err) {
      console.error('wrike-editorial-import failed:', err);
      toast.error("Échec de l'import Wrike");
    } finally {
      setIsImporting(false);
    }
  }, [currentClient?.id, wrikeFolderId, refetch]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredEntriesByDate = useMemo(() => {
    if (filterCanal === 'all') return entriesByDate;
    const result: Record<string, CalendarEntry[]> = {};
    for (const [date, items] of Object.entries(entriesByDate)) {
      const filtered = items.filter((e) => e.canal === filterCanal);
      if (filtered.length > 0) result[date] = filtered;
    }
    return result;
  }, [entriesByDate, filterCanal]);

  const canals = useMemo(() => {
    const set = new Set(entries.map((e) => e.canal));
    return Array.from(set).sort();
  }, [entries]);

  const handleDragStart = useCallback((e: React.DragEvent, entryId: string) => {
    setDraggedEntryId(entryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entryId);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    if (!entryId) return;
    const newDate = format(targetDate, 'yyyy-MM-dd');
    try {
      await moveEntry(entryId, newDate);
      toast.success('Publication déplacée');
    } catch {
      toast.error('Erreur lors du déplacement');
    }
    setDraggedEntryId(null);
  }, [moveEntry]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateEntryStatus(id, status);
      toast.success(`Statut mis à jour: ${status}`);
      setDetailOpen(false);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-500" />
            Calendrier Éditorial
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAllClientsSelected ? 'Tous les clients' : currentClient?.name} · {stats.total} publications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !isAllClientsSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWrikeImport}
              disabled={isImporting || !wrikeFolderId}
              title={wrikeFolderId ? 'Importer les tâches Wrike (articles, posts, newsletters)' : 'Aucun projet Wrike associé'}
            >
              <Download className={cn('w-4 h-4 mr-2', isImporting && 'animate-pulse')} />
              {isImporting ? 'Import en cours…' : 'Importer Wrike'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-3 flex items-center gap-2">
              <Badge className={cn('text-xs', statusColors[status])}>{status}</Badge>
              <span className="font-bold text-lg">{count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Month nav + filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>Aujourd'hui</Button>
        </div>
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les canaux</SelectItem>
            {canals.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
                {day}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEntries = filteredEntriesByDate[dateKey] || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'min-h-[100px] p-1 border-b border-r last:border-r-0 transition-colors',
                    !inMonth && 'bg-muted/30',
                    today && 'bg-blue-50/50 dark:bg-blue-950/20',
                    draggedEntryId && 'hover:bg-accent/30'
                  )}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragOver={handleDragOver}
                >
                  <div className={cn(
                    'text-xs mb-1 px-1',
                    today ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
                    !inMonth && 'opacity-40'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0">
                    {dayEntries.map((entry) => (
                      <EntryChip
                        key={entry.id}
                        entry={entry}
                        onClick={() => { setSelectedEntry(entry); setDetailOpen(true); }}
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, entry.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EntryDetailDialog
        entry={selectedEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        isAdmin={isAdmin}
      />
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WrikeTask, getSectorColor } from '@/types/wrike';
import { ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WrikeTaskCardProps {
  task: WrikeTask;
  isAdmin: boolean;
  onClick?: () => void;
}

export function WrikeTaskCard({ task, isAdmin, onClick }: WrikeTaskCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-3 cursor-pointer hover:shadow-md transition-all border border-border hover:border-primary/30 bg-card"
    >
      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-tight mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Client chip */}
      {task.clientName && (
        <Badge variant="secondary" className={cn('text-[10px] mb-2', getSectorColor(task.clientSector))}>
          {task.clientName}
        </Badge>
      )}

      {/* Canal + Format */}
      <div className="flex flex-wrap gap-1 mb-2">
        {task.canal && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {task.canal}
          </Badge>
        )}
        {task.format && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {task.format}
          </Badge>
        )}
      </div>

      {/* Due date */}
      {task.dates?.due && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.dates.due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </div>
      )}

      {/* Link to content */}
      {task.lienContenuProd && (
        <a
          href={task.lienContenuProd}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" />
          Voir le contenu
        </a>
      )}

      {/* Admin-only: budget */}
      {isAdmin && task.budgetTache != null && task.budgetTache > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground bg-primary/5 -mx-3 -mb-3 px-3 pb-2 rounded-b-lg">
          {task.budgetTache.toLocaleString('fr-FR')} €
        </div>
      )}
    </Card>
  );
}

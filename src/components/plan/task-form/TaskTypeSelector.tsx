import { TASK_TYPE_OPTIONS, TaskType } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { FileText, Search, Palette, Share2, Target, MoreHorizontal } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  FileText, Search, Palette, Share2, Target, MoreHorizontal,
};

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
}

export function TaskTypeSelector({ value, onChange }: TaskTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TASK_TYPE_OPTIONS.map((opt) => {
        const Icon = ICONS[opt.icon];
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

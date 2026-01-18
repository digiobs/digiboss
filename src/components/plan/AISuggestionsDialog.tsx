import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TaskStatus, TaskPriority } from '@/types/tasks';
import { Sparkles, Loader2, Clock, Tag, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  estimatedHours?: number;
  tags?: string[];
}

interface AISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  onAddSuggestions: (suggestions: AISuggestion[]) => void;
  onRetry: () => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function AISuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  isLoading,
  error,
  onAddSuggestions,
  onRetry,
}: AISuggestionsDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  };

  const handleAdd = () => {
    const selectedSuggestions = suggestions.filter((_, i) => selected.has(i));
    onAddSuggestions(selectedSuggestions);
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Task Suggestions
          </DialogTitle>
          <DialogDescription>
            AI-generated task recommendations based on your current marketing plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p>Analyzing your plan and generating suggestions...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-3" />
              <p>No suggestions available. Try generating new ones.</p>
            </div>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {selected.size} of {suggestions.length} selected
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selected.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border transition-all cursor-pointer',
                    selected.has(index)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => toggleSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(index)}
                      onCheckedChange={() => toggleSelection(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge variant="secondary" className={priorityColors[suggestion.priority]}>
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {suggestion.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {suggestion.estimatedHours}h
                          </span>
                        )}
                        {suggestion.tags && suggestion.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {suggestion.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selected.size === 0 || isLoading}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Add {selected.size} Task{selected.size !== 1 ? 's' : ''} to Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

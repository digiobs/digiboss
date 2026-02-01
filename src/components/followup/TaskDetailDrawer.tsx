import { format } from 'date-fns';
import { Clock, User, CheckSquare, MessageSquare, Link, Sparkles, ExternalLink, Palette, FileText, Globe, TrendingUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FollowupTask, WorkflowType, Priority } from '@/types/followup';
import { cn } from '@/lib/utils';

interface TaskDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: FollowupTask | null;
  onUpdate?: (task: FollowupTask) => void;
}

const workflowIcons: Record<WorkflowType, React.ElementType> = {
  branding: Palette,
  content: FileText,
  web: Globe,
  growth: TrendingUp,
};

const workflowColors: Record<WorkflowType, string> = {
  branding: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  content: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  web: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  growth: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const priorityColors: Record<Priority, string> = {
  P1: 'bg-destructive/10 text-destructive border-destructive/30',
  P2: 'bg-warning/10 text-warning border-warning/30',
  P3: 'bg-muted text-muted-foreground border-muted',
};

export function TaskDetailDrawer({ open, onOpenChange, task, onUpdate }: TaskDetailDrawerProps) {
  if (!task) return null;

  const WorkflowIcon = workflowIcons[task.workflow];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            <Badge variant="secondary" className={cn('text-xs', workflowColors[task.workflow])}>
              <WorkflowIcon className="h-3 w-3 mr-0.5" />
              {task.workflow}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          <SheetTitle className="text-lg leading-tight">{task.title}</SheetTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {task.owner}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due {format(task.dueDate, 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 pr-4">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <section>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </section>
            )}

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  Checklist
                </h3>
                <div className="space-y-2">
                  {task.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox checked={item.completed} />
                      <span className={cn('text-sm', item.completed && 'line-through text-muted-foreground')}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Linked Assets */}
            {task.linkedAssets && task.linkedAssets.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  Linked Assets
                </h3>
                <div className="space-y-2">
                  {task.linkedAssets.map((asset, index) => (
                    <Button key={index} variant="outline" size="sm" className="w-full justify-start gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in {asset.type === 'figma' ? 'Figma' : 'SharePoint'}: {asset.name}
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* Related Meeting */}
            {task.linkedMeetingId && (
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Related Meeting
                </h3>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View meeting notes
                </Button>
              </section>
            )}

            <Separator />

            {/* Comments */}
            <section>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments
              </h3>
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {task.comments.map((comment, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(comment.date, 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No comments yet.</p>
              )}
              <Textarea placeholder="Add a comment..." className="min-h-[80px]" />
              <Button size="sm" className="mt-2">Add Comment</Button>
            </section>

            <Separator />

            {/* AI Suggested Improvements */}
            <section>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Suggested Improvements
              </h3>
              <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Based on the meeting context, consider breaking this task into smaller deliverables
                  to improve tracking and reduce review cycles.
                </p>
                <Button size="sm" variant="outline" className="mt-3 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Apply Suggestion
                </Button>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

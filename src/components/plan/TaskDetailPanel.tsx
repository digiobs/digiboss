import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  MessageSquare,
  CheckSquare,
  Square,
  Sparkles,
  Link2,
  Edit3,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, TaskStatus, TaskPriority, taskColumns } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask?: (task: Task) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

const statusColors: Record<TaskStatus, string> = {
  backlog: 'bg-muted text-muted-foreground',
  doing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function TaskDetailPanel({ task, open, onOpenChange, onUpdateTask }: TaskDetailPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [localTask, setLocalTask] = useState<Task | null>(task);

  // Update local task when prop changes
  if (task?.id !== localTask?.id) {
    setLocalTask(task);
  }

  if (!localTask) return null;

  const completedSubtasks = localTask.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = localTask.subtasks.length > 0 
    ? (completedSubtasks / localTask.subtasks.length) * 100 
    : 0;

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedTask = {
      ...localTask,
      subtasks: localTask.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
    };
    setLocalTask(updatedTask);
    onUpdateTask?.(updatedTask);
  };

  const handleStatusChange = (status: TaskStatus) => {
    const updatedTask = { ...localTask, status, updatedAt: new Date().toISOString() };
    setLocalTask(updatedTask);
    onUpdateTask?.(updatedTask);
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    const updatedTask = { ...localTask, priority, updatedAt: new Date().toISOString() };
    setLocalTask(updatedTask);
    onUpdateTask?.(updatedTask);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const updatedTask = {
      ...localTask,
      comments: [
        ...localTask.comments,
        {
          id: `c${Date.now()}`,
          author: 'Alex',
          content: newComment,
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setLocalTask(updatedTask);
    onUpdateTask?.(updatedTask);
    setNewComment('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {localTask.aiGenerated && (
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </Badge>
                )}
                <Badge variant="secondary" className={priorityColors[localTask.priority]}>
                  {localTask.priority} priority
                </Badge>
              </div>
              <SheetTitle className="text-xl font-semibold text-left">
                {localTask.title}
              </SheetTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {localTask.description}
              </p>
            </div>

            <Separator />

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                <Select value={localTask.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskColumns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Priority</h4>
                <Select value={localTask.priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Assignee
                </h4>
                <div className="flex items-center gap-2">
                  {localTask.assignee ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {localTask.assignee[0]}
                      </div>
                      <span className="text-sm">{localTask.assignee}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date
                </h4>
                {localTask.dueDate ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{format(new Date(localTask.dueDate), 'MMM d, yyyy')}</span>
                    {new Date(localTask.dueDate) < new Date() && localTask.status !== 'done' && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No due date</span>
                )}
              </div>

              {/* Estimated Time */}
              {localTask.estimatedHours && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Estimated
                  </h4>
                  <span className="text-sm">{localTask.estimatedHours} hours</span>
                </div>
              )}

              {/* Linked Campaign */}
              {localTask.linkedCampaign && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Campaign
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {localTask.linkedCampaign}
                  </Badge>
                </div>
              )}
            </div>

            {/* Tags */}
            {localTask.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {localTask.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Subtasks */}
            {localTask.subtasks.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Subtasks
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {completedSubtasks} / {localTask.subtasks.length} completed
                    </span>
                  </div>
                  <Progress value={subtaskProgress} className="h-1.5 mb-3" />
                  <div className="space-y-2">
                    {localTask.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleToggleSubtask(subtask.id)}
                      >
                        {subtask.completed ? (
                          <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(
                          'text-sm',
                          subtask.completed && 'line-through text-muted-foreground'
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Comments */}
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Activity ({localTask.comments.length})
              </h4>
              
              {localTask.comments.length > 0 ? (
                <div className="space-y-4 mb-4">
                  {localTask.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                        comment.author === 'AI' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {comment.author === 'AI' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : (
                          comment.author[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No comments yet.</p>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Comment
                </Button>
              </div>
            </div>

            {/* Timestamps */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created {formatDistanceToNow(new Date(localTask.createdAt), { addSuffix: true })}</p>
              <p>Updated {formatDistanceToNow(new Date(localTask.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

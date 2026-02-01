import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { WorkflowType, Priority, TaskStatus } from '@/types/followup';

interface FollowupTopBarProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedWorkflows: WorkflowType[];
  onWorkflowsChange: (workflows: WorkflowType[]) => void;
  selectedOwner: string;
  onOwnerChange: (owner: string) => void;
  selectedPriority: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
}

const workflows: { value: WorkflowType; label: string }[] = [
  { value: 'branding', label: 'Branding' },
  { value: 'content', label: 'Content' },
  { value: 'web', label: 'Web' },
  { value: 'growth', label: 'Growth' },
];

const owners = ['All', 'Lucas M.', 'Sophie L.', 'Emma B.', 'Thomas D.', 'Marie C.'];

export function FollowupTopBar({
  dateRange,
  onDateRangeChange,
  selectedWorkflows,
  onWorkflowsChange,
  selectedOwner,
  onOwnerChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
}: FollowupTopBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const toggleWorkflow = (workflow: WorkflowType) => {
    if (selectedWorkflows.includes(workflow)) {
      onWorkflowsChange(selectedWorkflows.filter((w) => w !== workflow));
    } else {
      onWorkflowsChange([...selectedWorkflows, workflow]);
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border py-3 px-1 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                'Select dates'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border" />

        {/* Workflow Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Workflow:</span>
          <div className="flex gap-1.5">
            {workflows.map((wf) => (
              <Badge
                key={wf.value}
                variant={selectedWorkflows.includes(wf.value) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleWorkflow(wf.value)}
              >
                {wf.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Owner Select */}
        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Select */}
        <Select value={selectedPriority} onValueChange={(v) => onPriorityChange(v as Priority | 'all')}>
          <SelectTrigger className="w-[100px] h-8 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select value={selectedStatus} onValueChange={(v) => onStatusChange(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="to_validate">To Validate</SelectItem>
            <SelectItem value="to_publish">To Publish</SelectItem>
            <SelectItem value="waiting_client">Waiting Client</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

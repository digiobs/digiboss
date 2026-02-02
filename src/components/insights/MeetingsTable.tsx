import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Play,
  FileText,
  Users,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Meeting } from '@/types/insights';

interface MeetingsTableProps {
  meetings: Meeting[];
  searchQuery: string;
  onMeetingClick: (meeting: Meeting) => void;
}

type SortField = 'date' | 'title' | 'nbaCount' | 'participants';
type SortDirection = 'asc' | 'desc';

export function MeetingsTable({ meetings, searchQuery, onMeetingClick }: MeetingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedMeetings = useMemo(() => {
    let filtered = meetings;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = meetings.filter((meeting) => {
        const titleMatch = meeting.title.toLowerCase().includes(query);
        const participantMatch = meeting.participants.some(
          (p) => p.name.toLowerCase().includes(query) || p.company.toLowerCase().includes(query)
        );
        const transcriptMatch = meeting.transcript.some((t) =>
          t.text.toLowerCase().includes(query)
        );
        return titleMatch || participantMatch || transcriptMatch;
      });
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'nbaCount':
          comparison = a.nbaCount - b.nbaCount;
          break;
        case 'participants':
          comparison = a.participants.length - b.participants.length;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [meetings, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (filteredAndSortedMeetings.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No meetings found</h3>
        <p className="text-muted-foreground mb-6">
          {searchQuery
            ? 'Try adjusting your search query.'
            : 'Connect tl;dv to unlock meeting intelligence.'}
        </p>
        {!searchQuery && (
          <Button variant="outline">Connect tl;dv</Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                Date
                <SortIcon field="date" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-1">
                Meeting title
                <SortIcon field="title" />
              </div>
            </TableHead>
            <TableHead>Video</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('participants')}
            >
              <div className="flex items-center gap-1">
                Participants
                <SortIcon field="participants" />
              </div>
            </TableHead>
            <TableHead>Transcript</TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('nbaCount')}
            >
              <div className="flex items-center gap-1 justify-end">
                NBA
                <SortIcon field="nbaCount" />
              </div>
            </TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedMeetings.map((meeting) => (
            <TableRow
              key={meeting.id}
              className="cursor-pointer"
              onClick={() => onMeetingClick(meeting)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-sm">
                    {format(new Date(meeting.date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(meeting.date), 'HH:mm')} · {meeting.duration}min
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground line-clamp-1">
                    {meeting.title}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {meeting.workflowTags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {meeting.thumbnailUrl ? (
                  <div className="relative w-20 h-12 rounded overflow-hidden bg-muted group">
                    <img
                      src={meeting.thumbnailUrl}
                      alt={meeting.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-12 rounded bg-muted flex items-center justify-center">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <div className="flex items-center -space-x-2">
                    {meeting.participants.slice(0, 4).map((participant) => (
                      <Tooltip key={participant.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="w-8 h-8 border-2 border-background">
                            <AvatarImage src={participant.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {participant.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-muted-foreground">
                              {participant.role} · {participant.company}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {meeting.participants.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{meeting.participants.length - 4}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <Badge
                  variant={meeting.transcriptStatus === 'ready' ? 'secondary' : 'outline'}
                  className={
                    meeting.transcriptStatus === 'ready'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : meeting.transcriptStatus === 'processing'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {meeting.transcriptStatus === 'ready'
                    ? 'Ready'
                    : meeting.transcriptStatus === 'processing'
                    ? 'Processing'
                    : 'Failed'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {meeting.nbaCount > 0 ? (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {meeting.nbaCount}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMeetingClick(meeting);
                  }}
                >
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

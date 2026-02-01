import { format } from 'date-fns';
import { Users, Clock, Lightbulb, AlertCircle, CheckSquare, ListChecks, Quote, Send, Link } from 'lucide-react';
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
import { MeetingTranscript, MeetingSummary, Verbatim, VerbatimTag } from '@/types/followup';
import { VerbatimCard } from './VerbatimCard';

interface MeetingSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: MeetingTranscript | null;
  summary?: MeetingSummary;
  verbatims: Verbatim[];
}

const tagColors: Record<VerbatimTag, string> = {
  pain: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  benefit: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  objection: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  proof: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  feature: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export function MeetingSummaryDrawer({
  open,
  onOpenChange,
  transcript,
  summary,
  verbatims,
}: MeetingSummaryDrawerProps) {
  if (!transcript) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-lg">{transcript.title}</SheetTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{format(transcript.date, 'MMMM d, yyyy')}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {transcript.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {transcript.attendees.length} attendees
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {transcript.attendees.map((attendee) => (
              <Badge key={attendee} variant="secondary" className="text-xs">
                {attendee}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 pr-4">
          {summary ? (
            <div className="space-y-6">
              {/* Main Ideas */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Main Ideas
                </h3>
                <ul className="space-y-2">
                  {summary.mainIdeas.map((idea, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Problem Points */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Problem Points
                </h3>
                <ul className="space-y-2">
                  {summary.problemPoints.map((point, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Decisions */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-success" />
                  Decisions
                </h3>
                <ul className="space-y-2">
                  {summary.decisions.map((decision, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-success mt-2 shrink-0" />
                      {decision}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Action Items */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Action Items
                </h3>
                <div className="space-y-2">
                  {summary.actionItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-muted/30 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {item.assignee && <Badge variant="outline" className="text-xs">{item.assignee}</Badge>}
                          {item.dueDate && <span>Due: {format(item.dueDate, 'MMM d')}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 gap-1">
                        <Link className="h-3 w-3" />
                        Create Task
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Verbatims */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Quote className="h-4 w-4 text-muted-foreground" />
                  Key Verbatims
                </h3>
                {verbatims.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No verbatims extracted from this meeting.</p>
                ) : (
                  <div className="space-y-3">
                    {verbatims.map((verbatim) => (
                      <VerbatimCard key={verbatim.id} verbatim={verbatim} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No summary available</p>
              <p className="text-xs text-muted-foreground mt-1">AI summary is being generated...</p>
              <Button size="sm" className="mt-4 gap-2">
                <Send className="h-3.5 w-3.5" />
                Generate Summary
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

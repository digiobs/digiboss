import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Users, Clock, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MeetingTranscript, MeetingSummary, Verbatim } from '@/types/followup';
import { MeetingSummaryDrawer } from './MeetingSummaryDrawer';
import { cn } from '@/lib/utils';

interface MeetingIntelligenceProps {
  transcripts: MeetingTranscript[];
  summaries: Record<string, MeetingSummary>;
  verbatims: Verbatim[];
}

export function MeetingIntelligence({ transcripts, summaries, verbatims }: MeetingIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<MeetingTranscript | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredTranscripts = transcripts.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTranscriptClick = (transcript: MeetingTranscript) => {
    setSelectedTranscript(transcript);
    setDrawerOpen(true);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Meeting Intelligence
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-hidden">
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {filteredTranscripts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No meetings found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredTranscripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    onClick={() => handleTranscriptClick(transcript)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm hover:border-primary/30',
                      selectedTranscript?.id === transcript.id && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium leading-tight">{transcript.title}</h4>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {transcript.duration}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {transcript.attendees.length}
                      </span>
                      <span>{format(transcript.date, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {transcript.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs h-5 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                      {transcript.hasActionItems && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5 gap-0.5 text-success border-success/30">
                          <CheckCircle className="h-3 w-3" />
                          Actions
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <MeetingSummaryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transcript={selectedTranscript}
        summary={selectedTranscript ? summaries[selectedTranscript.id] : undefined}
        verbatims={selectedTranscript ? verbatims.filter((v) => v.meetingId === selectedTranscript.id) : []}
      />
    </>
  );
}

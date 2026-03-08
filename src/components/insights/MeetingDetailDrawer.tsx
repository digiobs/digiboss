import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  X,
  Play,
  FileText,
  Brain,
  MessageSquareQuote,
  Sparkles,
  Clock,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Meeting, NBA } from '@/types/insights';
import { formatTimestamp, verbatimTagConfig, getNBAsByMeetingId } from '@/data/insightsData';
import { NBACard } from './NBACard';

interface MeetingDetailDrawerProps {
  meeting: Meeting | null;
  open: boolean;
  onClose: () => void;
}

export function MeetingDetailDrawer({ meeting, open, onClose }: MeetingDetailDrawerProps) {
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [activeTab, setActiveTab] = useState('video');

  if (!meeting) return null;

  const meetingNBAs = getNBAsByMeetingId(meeting.id);

  const filteredTranscript = transcriptSearch
    ? meeting.transcript.filter((segment) =>
        segment.text.toLowerCase().includes(transcriptSearch.toLowerCase())
      )
    : meeting.transcript;

  const handleSeekTo = (seconds: number) => {
    // Placeholder: In real implementation, this would seek the video
    console.log('Seek to:', formatTimestamp(seconds));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <SheetTitle className="text-lg font-semibold text-foreground">
                {meeting.title}
              </SheetTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(meeting.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
                <span>·</span>
                <span>{meeting.duration} min</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {meeting.participants.length} participants
                </span>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {meeting.workflowTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="capitalize text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border">
            <TabsList className="h-12 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="video"
                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 gap-1.5"
              >
                <Play className="w-4 h-4" />
                Video
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 gap-1.5"
              >
                <Brain className="w-4 h-4" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger
                value="verbatims"
                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 gap-1.5"
              >
                <MessageSquareQuote className="w-4 h-4" />
                Verbatims
                <Badge variant="secondary" className="text-xs px-1.5">
                  {meeting.verbatims.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="nba"
                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                NBA
                <Badge variant="secondary" className="text-xs px-1.5">
                  {meetingNBAs.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* Video Tab */}
            <TabsContent value="video" className="p-6 space-y-4 mt-0">
              {/* Video Player Placeholder */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {meeting.thumbnailUrl ? (
                  <>
                    <img
                      src={meeting.thumbnailUrl}
                      alt={meeting.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button size="lg" className="gap-2">
                        <Play className="w-5 h-5 fill-current" />
                        Watch Recording
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <p className="text-muted-foreground">Preview not available</p>
                      {meeting.videoUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={meeting.videoUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open recording
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Highlights / Chapters */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Highlights</h3>
                {meeting.highlights.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    No highlights extracted yet for this meeting.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meeting.highlights.map((highlight) => (
                      <button
                        key={highlight.id}
                        onClick={() => handleSeekTo(highlight.timestamp)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <Badge
                          variant="outline"
                          className={
                            highlight.type === 'decision'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0'
                              : highlight.type === 'problem'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0'
                              : highlight.type === 'opportunity'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0'
                          }
                        >
                          {formatTimestamp(highlight.timestamp)}
                        </Badge>
                        <span className="flex-1 text-sm font-medium">
                          {highlight.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Participants</h3>
                <div className="flex flex-wrap gap-2">
                  {meeting.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={participant.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {participant.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-muted-foreground"> · {participant.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="p-6 space-y-4 mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in transcript..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-1">
                {filteredTranscript.map((segment) => (
                  <button
                    key={segment.id}
                    onClick={() => handleSeekTo(segment.startTime)}
                    className={`w-full flex gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 ${
                      segment.isHighlight ? 'bg-primary/5 border border-primary/20' : ''
                    }`}
                  >
                    <span className="text-xs text-muted-foreground font-mono w-10 shrink-0">
                      {formatTimestamp(segment.startTime)}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-primary">
                        {segment.speakerName}:
                      </span>{' '}
                      <span className="text-sm text-foreground">{segment.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* AI Summary Tab */}
            <TabsContent value="summary" className="p-6 space-y-6 mt-0">
              {meeting.aiSummary.decisions.length === 0 &&
                meeting.aiSummary.problems.length === 0 &&
                meeting.aiSummary.opportunities.length === 0 &&
                meeting.aiSummary.actionItems.length === 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    No AI summary available yet for this meeting.
                  </div>
                )}
              {/* Decisions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-foreground">Decisions</h3>
                </div>
                <ul className="space-y-2">
                  {meeting.aiSummary.decisions.map((decision, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Problems */}
              {meeting.aiSummary.problems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-foreground">Problems / Blockers</h3>
                  </div>
                  <ul className="space-y-2">
                    {meeting.aiSummary.problems.map((problem, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {meeting.aiSummary.opportunities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-foreground">Opportunities</h3>
                  </div>
                  <ul className="space-y-2">
                    {meeting.aiSummary.opportunities.map((opportunity, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30"
                      >
                        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-foreground">Action Items</h3>
                </div>
                <ul className="space-y-2">
                  {meeting.aiSummary.actionItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.action}</span>
                        {item.owner && (
                          <span className="text-sm text-muted-foreground"> — {item.owner}</span>
                        )}
                      </div>
                      {item.dueDate && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {format(new Date(item.dueDate), 'd MMM', { locale: fr })}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            {/* Verbatims Tab */}
            <TabsContent value="verbatims" className="p-6 space-y-4 mt-0">
              {meeting.verbatims.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquareQuote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No verbatims extracted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meeting.verbatims.map((verbatim) => (
                    <div
                      key={verbatim.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm italic text-foreground">"{verbatim.text}"</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {verbatim.speakerName}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <button
                            onClick={() => handleSeekTo(verbatim.timestamp)}
                            className="text-xs text-primary hover:underline"
                          >
                            {formatTimestamp(verbatim.timestamp)}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {verbatim.tags.map((tag) => {
                            const config = verbatimTagConfig[tag];
                            return (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className={`text-xs ${config.bgColor} ${config.color}`}
                              >
                                {config.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <Play className="w-3 h-3 mr-1" />
                          Play from {formatTimestamp(verbatim.timestamp)}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          Use in Content
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* NBA Tab */}
            <TabsContent value="nba" className="p-6 space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {meetingNBAs.length} action{meetingNBAs.length > 1 ? 's' : ''} generated from this meeting
                </p>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Generate NBA from this meeting
                </Button>
              </div>

              {meetingNBAs.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No NBA generated yet.</p>
                  <Button variant="outline" className="mt-4">
                    Generate NBA from this meeting
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingNBAs.map((nba) => (
                    <NBACard key={nba.id} nba={nba} compact />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

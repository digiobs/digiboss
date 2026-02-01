import { useState } from 'react';
import { Sparkles, Send, ThumbsUp, ThumbsDown, CheckCircle, XCircle, ArrowRight, User, Zap, TrendingUp, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FollowupRecommendation, ImpactLevel, EffortLevel, RecommendationStatus } from '@/types/followup';
import { cn } from '@/lib/utils';

interface FollowupNextBestActionsProps {
  recommendations: FollowupRecommendation[];
  onStatusChange?: (id: string, status: RecommendationStatus, note?: string) => void;
}

const suggestedQueries = [
  "Based on our last meeting, what should be the priority next week?",
  "What should we do before the next milestone?",
  "Which content should be produced next and why?",
];

const impactColors: Record<ImpactLevel, string> = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

const statusIcons: Record<RecommendationStatus, React.ElementType> = {
  proposed: Sparkles,
  accepted: ThumbsUp,
  rejected: ThumbsDown,
  implemented: CheckCircle,
};

export function FollowupNextBestActions({ recommendations, onStatusChange }: FollowupNextBestActionsProps) {
  const [query, setQuery] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<FollowupRecommendation | null>(null);
  const [feedbackAction, setFeedbackAction] = useState<'accept' | 'reject'>('accept');
  const [feedbackNote, setFeedbackNote] = useState('');

  const handleQuerySubmit = () => {
    if (query.trim()) {
      // Placeholder for AI query
      console.log('Query submitted:', query);
      setQuery('');
    }
  };

  const openFeedbackDialog = (rec: FollowupRecommendation, action: 'accept' | 'reject') => {
    setSelectedRecommendation(rec);
    setFeedbackAction(action);
    setFeedbackNote('');
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = () => {
    if (selectedRecommendation && onStatusChange) {
      const status = feedbackAction === 'accept' ? 'accepted' : 'rejected';
      onStatusChange(selectedRecommendation.id, status, feedbackNote);
    }
    setFeedbackDialogOpen(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Next Best Actions
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Strategy Agent recommendations based on meetings + performance signals
          </p>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-hidden flex flex-col">
          {/* Query Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask the Strategy Agent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                className="h-9"
              />
              <Button size="sm" className="shrink-0 h-9" onClick={handleQuerySubmit}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestedQueries.map((q, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setQuery(q)}
                >
                  {q.slice(0, 40)}...
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommendations List */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              {recommendations.map((rec) => {
                const StatusIcon = statusIcons[rec.status];
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      rec.status === 'proposed' && 'bg-card hover:border-primary/30',
                      rec.status === 'accepted' && 'bg-success/5 border-success/30',
                      rec.status === 'rejected' && 'bg-muted/50 border-muted opacity-60',
                      rec.status === 'implemented' && 'bg-primary/5 border-primary/30'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-sm font-medium leading-tight flex-1">{rec.title}</h4>
                      <StatusIcon className={cn(
                        'h-4 w-4 shrink-0',
                        rec.status === 'proposed' && 'text-primary',
                        rec.status === 'accepted' && 'text-success',
                        rec.status === 'rejected' && 'text-muted-foreground',
                        rec.status === 'implemented' && 'text-primary'
                      )} />
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className={cn('text-xs', impactColors[rec.impact])}>
                        {rec.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Effort: {rec.effort}
                      </Badge>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-muted-foreground">{rec.confidence}%</span>
                        <Progress value={rec.confidence} className="w-12 h-1.5" />
                      </div>
                    </div>

                    {/* Why Bullets */}
                    <div className="space-y-1 mb-3">
                      {rec.whyBullets.map((bullet, index) => (
                        <p key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                          {bullet}
                        </p>
                      ))}
                    </div>

                    {/* Sources */}
                    {rec.sources && rec.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {rec.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="text-xs h-5 gap-1">
                            {source.type === 'meeting' && <User className="h-3 w-3" />}
                            {source.type === 'analytics' && <BarChart className="h-3 w-3" />}
                            {source.type === 'seo' && <TrendingUp className="h-3 w-3" />}
                            {source.type === 'verbatim' && <Zap className="h-3 w-3" />}
                            {source.label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Learning Note */}
                    {rec.learningNote && (
                      <div className="p-2 rounded bg-muted/50 mb-3">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Learning: </span>
                          {rec.learningNote}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {rec.status === 'proposed' && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openFeedbackDialog(rec, 'accept')}>
                          <ArrowRight className="h-3 w-3" />
                          Convert to Task
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground ml-auto"
                          onClick={() => openFeedbackDialog(rec, 'reject')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {feedbackAction === 'accept' ? 'Accept Recommendation' : 'Dismiss Recommendation'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {feedbackAction === 'accept'
                ? 'This recommendation will be converted to a task. Add a note to help improve future suggestions.'
                : 'Why are you dismissing this recommendation? Your feedback helps improve future suggestions.'}
            </p>
            <Textarea
              placeholder={feedbackAction === 'accept' ? 'Why is this valuable? (optional)' : 'Reason for dismissing...'}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitFeedback}>
              {feedbackAction === 'accept' ? 'Accept & Create Task' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

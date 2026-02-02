import { Video, Sparkles, MessageSquareQuote, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Meeting } from '@/types/insights';

interface MeetingInsightsHeaderProps {
  meetingsCount: number;
  totalNBAs: number;
  totalVerbatims: number;
}

export function MeetingInsightsHeader({ 
  meetingsCount, 
  totalNBAs, 
  totalVerbatims 
}: MeetingInsightsHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Meeting Insights</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              tl;dv
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Everything decided, requested, and proven during client calls.
          </p>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{meetingsCount} meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{totalNBAs} NBA generated</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{totalVerbatims} verbatims</span>
        </div>
      </div>
    </div>
  );
}

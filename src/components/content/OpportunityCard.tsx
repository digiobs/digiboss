import { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Clock, 
  Share2, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Sparkles,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout,
  Plus,
  Calendar,
  Bookmark,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  ContentOpportunity, 
  contentTypeLabels, 
  funnelStageLabels,
  impactTypeLabels 
} from '@/types/content';

interface OpportunityCardProps {
  opportunity: ContentOpportunity;
  onGenerateDraft: (opp: ContentOpportunity) => void;
  onCreateTask: (opp: ContentOpportunity) => void;
  onSchedule: (opp: ContentOpportunity) => void;
  onSaveToBacklog: (opp: ContentOpportunity) => void;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

const funnelStageColors: Record<string, string> = {
  awareness: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  consideration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  conversion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function OpportunityCard({ 
  opportunity, 
  onGenerateDraft, 
  onCreateTask, 
  onSchedule,
  onSaveToBacklog 
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const Icon = contentTypeIcons[opportunity.contentType] || FileText;
  const { scoreBreakdown } = opportunity;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500';
    if (confidence >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className="group hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                {opportunity.suggestedTitle}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {opportunity.suggestedAngle}
              </p>
            </div>
          </div>
          
          {/* Score Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted/50 cursor-help shrink-0",
                getScoreColor(opportunity.opportunityScore)
              )}>
                <span className="text-xl font-bold">{opportunity.opportunityScore}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="w-64 p-3">
              <p className="font-medium mb-2">Score Breakdown</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demand Signal</span>
                  <span>{scoreBreakdown.demandSignal}/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impact Potential</span>
                  <span>{scoreBreakdown.impactPotential}/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Feasibility</span>
                  <span>{scoreBreakdown.feasibility}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timing</span>
                  <span>{scoreBreakdown.timing}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distribution</span>
                  <span>{scoreBreakdown.distributionAdvantage}/10</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {contentTypeLabels[opportunity.contentType]}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", funnelStageColors[opportunity.funnelStage])}>
            {funnelStageLabels[opportunity.funnelStage]}
          </Badge>
          {opportunity.impacts.slice(0, 3).map((impact) => (
            <Badge key={impact} variant="outline" className="text-xs">
              {impactTypeLabels[impact]}
            </Badge>
          ))}
        </div>

        {/* Confidence Bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", getConfidenceColor(opportunity.confidence))}
              style={{ width: `${opportunity.confidence}%` }}
            />
          </div>
          <span className="text-xs font-medium">{opportunity.confidence}%</span>
        </div>

        {/* Why Now */}
        <div className="bg-accent/50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-accent-foreground mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Why Now
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {opportunity.whyNow.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence Links - Collapsible */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {opportunity.evidenceLinks.length} evidence links
        </button>
        
        {expanded && (
          <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
            {opportunity.evidenceLinks.map((link, i) => (
              <a 
                key={i} 
                href={link.url || '#'}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button 
            size="sm" 
            className="gap-1.5 flex-1"
            onClick={() => onGenerateDraft(opportunity)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Draft
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCreateTask(opportunity)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create task in Plan</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSchedule(opportunity)}
              >
                <Calendar className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Schedule content</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSaveToBacklog(opportunity)}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to backlog</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

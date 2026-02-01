import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ThumbsUp,
  AlertTriangle,
  XCircle,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ContentItem, contentTypeLabels } from '@/types/content';
import { format } from 'date-fns';

interface FeedbackLoopProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

const recommendationConfig = {
  keep: {
    icon: ThumbsUp,
    label: 'Keep',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    description: 'Performing well, continue promoting',
  },
  improve: {
    icon: AlertTriangle,
    label: 'Improve',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'Has potential, needs optimization',
  },
  kill: {
    icon: XCircle,
    label: 'Kill',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    description: 'Underperforming, consider removing',
  },
};

function PerformanceCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const Icon = contentTypeIcons[item.contentType] || FileText;
  const performance = item.performance;
  
  if (!performance) return null;
  
  const recConfig = recommendationConfig[performance.recommendation];
  const RecIcon = recConfig.icon;
  
  return (
    <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium line-clamp-1 mb-1">{item.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{contentTypeLabels[item.contentType]}</span>
              <span>•</span>
              <span>Published {item.publishedDate && format(new Date(item.publishedDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <Badge className={cn("shrink-0", recConfig.color)}>
            <RecIcon className="w-3 h-3 mr-1" />
            {recConfig.label}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-semibold">{performance.sessions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{performance.engagementRate}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{performance.conversions}</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{performance.leadsAssisted}</p>
            <p className="text-xs text-muted-foreground">Leads Assisted</p>
          </div>
        </div>

        {/* Learnings */}
        {performance.learnings && performance.learnings.length > 0 && (
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Learnings
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {performance.learnings.map((learning, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  {learning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeedbackLoop({ items, onItemClick }: FeedbackLoopProps) {
  const publishedItems = items.filter(item => item.status === 'published' && item.performance);
  
  // Summary stats
  const keepCount = publishedItems.filter(i => i.performance?.recommendation === 'keep').length;
  const improveCount = publishedItems.filter(i => i.performance?.recommendation === 'improve').length;
  const killCount = publishedItems.filter(i => i.performance?.recommendation === 'kill').length;
  
  const totalSessions = publishedItems.reduce((sum, i) => sum + (i.performance?.sessions || 0), 0);
  const totalConversions = publishedItems.reduce((sum, i) => sum + (i.performance?.conversions || 0), 0);
  const avgEngagement = publishedItems.length > 0 
    ? Math.round(publishedItems.reduce((sum, i) => sum + (i.performance?.engagementRate || 0), 0) / publishedItems.length)
    : 0;

  if (publishedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Published Content Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Once you publish content, you'll see performance metrics and AI-powered recommendations here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalConversions}</p>
                <p className="text-xs text-muted-foreground">Total Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgEngagement}%</p>
                <p className="text-xs text-muted-foreground">Avg Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedItems.length}</p>
                <p className="text-xs text-muted-foreground">Items Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recommendation Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex h-3 rounded-full overflow-hidden">
                {keepCount > 0 && (
                  <div 
                    className="bg-emerald-500" 
                    style={{ width: `${(keepCount / publishedItems.length) * 100}%` }}
                  />
                )}
                {improveCount > 0 && (
                  <div 
                    className="bg-amber-500" 
                    style={{ width: `${(improveCount / publishedItems.length) * 100}%` }}
                  />
                )}
                {killCount > 0 && (
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(killCount / publishedItems.length) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Keep ({keepCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Improve ({improveCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Kill ({killCount})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Performance List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {publishedItems.map((item) => (
            <PerformanceCard 
              key={item.id} 
              item={item} 
              onClick={() => onItemClick(item)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

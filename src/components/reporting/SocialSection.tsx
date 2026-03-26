import { Linkedin, Users, Eye, MousePointerClick, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { socialKPIs, bestPosts } from '@/data/analyticsData';
import { cn } from '@/lib/utils';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function SocialSection() {
  const { getMetric, hasData } = useReportingMetrics(['social', 'paid']);
  const liveFollowers = getMetric('li_followers', socialKPIs.followers);
  const liveImpressions = getMetric('li_impressions', socialKPIs.impressions);
  const liveClicks = getMetric('ad_clicks', socialKPIs.clicks);

  const kpiCards = [
    { label: 'Followers', value: Math.round(liveFollowers).toLocaleString(), icon: Users },
    { label: 'New Followers', value: hasData ? 'NA' : `+${socialKPIs.newFollowers}`, delta: hasData ? 0 : socialKPIs.newFollowersDelta, icon: Users },
    { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString(), delta: 0, icon: Eye },
    { label: 'Engagements', value: hasData ? 'NA' : socialKPIs.engagements.toLocaleString(), delta: hasData ? 0 : socialKPIs.engagementsDelta, icon: MousePointerClick },
    { label: 'Clicks', value: Math.round(liveClicks).toLocaleString(), delta: 0, icon: MousePointerClick },
    { label: 'Likes', value: socialKPIs.likes.toLocaleString(), delta: socialKPIs.likesDelta, icon: Heart },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
          <h2 className="font-semibold">Social Performance</h2>
          <Badge variant="secondary" className="text-xs">{hasData ? 'LinkedIn Live' : 'LinkedIn Organic'}</Badge>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs">{kpi.label}</span>
                </div>
                <p className="text-lg font-bold">{kpi.value}</p>
                {kpi.delta && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">+{kpi.delta}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Best Posts */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Best Performing Posts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {bestPosts.map((post, index) => (
              <div 
                key={post.id} 
                className={cn(
                  "p-4 rounded-lg border transition-all hover:shadow-md",
                  index === 0 ? "bg-gradient-to-br from-[#0A66C2]/5 to-[#0A66C2]/10 border-[#0A66C2]/20" : "bg-muted/30 border-border"
                )}
              >
                {index === 0 && (
                  <Badge className="mb-2 bg-[#0A66C2]">Top Post</Badge>
                )}
                <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                <div className="text-xs text-muted-foreground mb-3">
                  {new Date(post.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <Eye className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-xs font-medium">{(post.impressions / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <MousePointerClick className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-xs font-medium">{post.clicks}</p>
                  </div>
                  <div>
                    <Heart className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-xs font-medium">{post.likes}</p>
                  </div>
                  <div>
                    <Share2 className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-xs font-medium">{post.shares}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

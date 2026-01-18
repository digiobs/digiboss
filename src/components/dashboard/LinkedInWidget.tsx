import { useState } from 'react';
import { Linkedin, Users, Eye, ThumbsUp, MessageSquare, Share2, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkedIn } from '@/hooks/useLinkedIn';

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex-1 min-w-[100px]">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-semibold text-lg">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{change}%
      </div>
    </div>
  );
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  timestamp: string;
  url: string;
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        {post.imageUrl && !imageError ? (
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A66C2]/10">
            <Linkedin className="w-6 h-6 text-[#0A66C2]/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {post.comments}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            {post.shares}
          </span>
          <span className="ml-auto">{post.timestamp}</span>
        </div>
      </div>
    </a>
  );
}

export function LinkedInWidget() {
  const { data, isLoading, error, refetch, isRefetching } = useLinkedIn();

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">LinkedIn</h3>
              {data?.isConnected ? (
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Sample Data
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Company page performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="https://www.linkedin.com/company/dashboard" target="_blank" rel="noopener noreferrer" className="gap-1">
              View page
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>

      {!data?.isConnected && !isLoading && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium">LinkedIn API not configured</p>
              <p className="mt-1">Add LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORGANIZATION_ID to backend secrets to display real data.</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load LinkedIn data</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data ? (
        <>
          {/* Metrics */}
          <div className="flex gap-3 mb-4">
            <MetricCard
              label="Followers"
              value={data.companyPage.followers}
              change={data.companyPage.followersChange}
              icon={<Users className="w-3 h-3" />}
            />
            <MetricCard
              label="Impressions"
              value={`${(data.companyPage.impressions / 1000).toFixed(1)}K`}
              change={data.companyPage.impressionsChange}
              icon={<Eye className="w-3 h-3" />}
            />
            <MetricCard
              label="Engagement"
              value={`${data.companyPage.engagement}%`}
              change={data.companyPage.engagementChange}
              icon={<ThumbsUp className="w-3 h-3" />}
            />
          </div>

          {/* Recent Posts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recent Posts</span>
              <Badge variant="outline" className="text-xs">
                {data.recentPosts.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {data.recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

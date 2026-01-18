import { useState } from 'react';
import { Linkedin, Users, Eye, ThumbsUp, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data - in production, this would come from LinkedIn API
const mockLinkedInData = {
  companyPage: {
    name: "Your Company",
    followers: 12450,
    followersChange: 3.2,
    impressions: 45200,
    impressionsChange: 12.5,
    engagement: 4.8,
    engagementChange: 0.3,
  },
  recentPosts: [
    {
      id: '1',
      content: "🚀 Excited to announce our latest AI-powered marketing features! Automation has never been smarter. #B2BMarketing #AI",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
      likes: 234,
      comments: 45,
      shares: 28,
      impressions: 12500,
      timestamp: "2 days ago",
      url: "https://linkedin.com/posts/example1"
    },
    {
      id: '2',
      content: "📊 New case study: How Bioseb increased lead generation by 340% in 6 months. Read the full story →",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
      likes: 189,
      comments: 32,
      shares: 51,
      impressions: 9800,
      timestamp: "5 days ago",
      url: "https://linkedin.com/posts/example2"
    },
    {
      id: '3',
      content: "Join us for our upcoming webinar on 'The Future of B2B Marketing in 2024' 🎯 Link in comments!",
      imageUrl: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=400",
      likes: 156,
      comments: 67,
      shares: 19,
      impressions: 7200,
      timestamp: "1 week ago",
      url: "https://linkedin.com/posts/example3"
    }
  ]
};

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

interface PostCardProps {
  post: typeof mockLinkedInData.recentPosts[0];
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
        {!imageError ? (
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
  const [isLoading] = useState(false);
  const data = mockLinkedInData;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          </div>
          <div>
            <h3 className="font-semibold">LinkedIn</h3>
            <p className="text-xs text-muted-foreground">Company page performance</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="https://www.linkedin.com/company/dashboard" target="_blank" rel="noopener noreferrer" className="gap-1">
            View page
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>

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
      ) : (
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
      )}
    </div>
  );
}

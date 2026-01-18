import { useState } from 'react';
import { FileText, ExternalLink, Calendar, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data - in production, this would come from your CMS or blog platform
const mockBlogPosts = [
  {
    id: '1',
    title: "The Complete Guide to B2B Marketing Automation in 2024",
    excerpt: "Learn how to automate your marketing workflows and increase efficiency by 40%.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    publishedAt: "Jan 15, 2024",
    views: 2340,
    viewsChange: 18,
    url: "/blog/b2b-marketing-automation-guide",
    category: "Marketing",
    isNew: true,
  },
  {
    id: '2',
    title: "5 Lead Scoring Models That Actually Work",
    excerpt: "Data-driven approaches to qualify your leads and focus on high-intent prospects.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    publishedAt: "Jan 12, 2024",
    views: 1890,
    viewsChange: 12,
    url: "/blog/lead-scoring-models",
    category: "Lead Gen",
    isNew: false,
  },
  {
    id: '3',
    title: "Content Marketing ROI: How to Measure What Matters",
    excerpt: "Stop guessing and start measuring your content's true impact on revenue.",
    imageUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
    publishedAt: "Jan 8, 2024",
    views: 3210,
    viewsChange: 24,
    url: "/blog/content-marketing-roi",
    category: "Analytics",
    isNew: false,
  },
];

interface BlogPostCardProps {
  post: typeof mockBlogPosts[0];
}

function BlogPostCard({ post }: BlogPostCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={post.url}
      className="group flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        {!imageError ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <FileText className="w-6 h-6 text-primary/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {post.title}
          </h4>
          {post.isNew && (
            <Badge className="bg-primary/10 text-primary text-[10px] shrink-0">New</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.publishedAt}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            +{post.viewsChange}%
          </span>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {post.category}
          </Badge>
        </div>
      </div>
    </a>
  );
}

export function BlogPostsWidget() {
  const posts = mockBlogPosts;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Recent Blog Posts</h3>
            <p className="text-xs text-muted-foreground">Latest content from your website</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/blog" className="gap-1">
            View all
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>

      <div className="space-y-1">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{posts.length}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {posts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total views</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-emerald-600">
              +{Math.round(posts.reduce((sum, p) => sum + p.viewsChange, 0) / posts.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg. growth</div>
          </div>
        </div>
      </div>
    </div>
  );
}

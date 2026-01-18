import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Cpu,
  DollarSign,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketNews, NewsArticle } from '@/hooks/useMarketNews';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'industry', label: 'Industry', icon: Building2 },
  { id: 'competitor', label: 'Competitors', icon: Users },
];

const categoryColors: Record<string, string> = {
  marketing: 'bg-primary/10 text-primary',
  technology: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  finance: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  industry: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  competitor: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

interface NewsCardProps {
  article: NewsArticle;
}

function NewsCard({ article }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.timestamp), { addSuffix: true });
  
  return (
    <div className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', categoryColors[article.category] || categoryColors.industry)}>
          <Newspaper className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
            {article.summary}
          </p>
          
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className={cn('text-xs', categoryColors[article.category])}>
              {article.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{article.source}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          {article.citations && article.citations.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {article.citations.length} sources
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketNews() {
  const [activeCategory, setActiveCategory] = useState('marketing');
  const { articles, isLoading, error, refetch } = useMarketNews(activeCategory);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    refetch(category);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Market News</h2>
          <Badge variant="secondary" className="text-xs">
            AI-Powered
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch(activeCategory)}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <NewsCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Newspaper className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch(activeCategory)}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8">
                <Newspaper className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No news found for this category.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

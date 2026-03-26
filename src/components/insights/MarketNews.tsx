import { useState, useEffect, useMemo } from 'react';
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
  ImageOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketNews, NewsArticle } from '@/hooks/useMarketNews';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const defaultCategories = [
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
  const [imageError, setImageError] = useState(false);
  
  const hasValidImage = article.imageUrl && !imageError;
  
  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer overflow-hidden">
      {/* Thumbnail */}
      {hasValidImage ? (
        <div className="relative w-full">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </AspectRatio>
        </div>
      ) : null}
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {!hasValidImage && (
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', categoryColors[article.category] || categoryColors.industry)}>
              <Newspaper className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {article.summary}
            </p>
            
            <div className="flex items-center gap-3 mt-3 flex-wrap">
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
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4">
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

interface MarketNewsProps {
  competitors?: string[];
  keywords?: string[];
  industry?: string;
}

export function MarketNews({ competitors, keywords, industry }: MarketNewsProps) {
  const [activeCategory, setActiveCategory] = useState('marketing');
  const { articles, isLoading, error, refetch } = useMarketNews(activeCategory, { competitors, keywords, industry });

  // Adapt tab labels to current client context.
  const contextualCategories = useMemo(() => {
    const firstKeyword = keywords?.[0]?.trim();
    const secondKeyword = keywords?.[1]?.trim();
    const industryLabel = industry?.trim();

    return defaultCategories.map((cat) => {
      if (cat.id === 'marketing') {
        return {
          ...cat,
          label: firstKeyword ? `Marketing: ${firstKeyword}` : cat.label,
        };
      }
      if (cat.id === 'technology') {
        return {
          ...cat,
          label: secondKeyword
            ? `Technology: ${secondKeyword}`
            : industryLabel
              ? `Technology: ${industryLabel}`
              : cat.label,
        };
      }
      if (cat.id === 'finance') {
        return {
          ...cat,
          label: industryLabel ? `Finance: ${industryLabel}` : cat.label,
        };
      }
      if (cat.id === 'industry') {
        return {
          ...cat,
          label: industryLabel ? `Industry: ${industryLabel}` : cat.label,
        };
      }
      if (cat.id === 'competitor') {
        return {
          ...cat,
          label: competitors && competitors.length > 0 ? `Competitors (${competitors.length})` : cat.label,
        };
      }
      return cat;
    });
  }, [competitors, industry, keywords]);

  // Keep competitor tab only when competitors are configured.
  const categories = useMemo(() => {
    if (competitors && competitors.length > 0) {
      return contextualCategories;
    }
    return contextualCategories.filter(c => c.id !== 'competitor');
  }, [competitors, contextualCategories]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    refetch(category, { competitors, keywords, industry });
  };

  // Refetch when config changes
  useEffect(() => {
    refetch(activeCategory, { competitors, keywords, industry });
  }, [competitors?.join(','), keywords?.join(','), industry]);

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
          onClick={() => refetch(activeCategory, { competitors, keywords, industry })}
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
                className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 max-w-[220px]"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{cat.label}</span>
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
                  onClick={() => refetch(activeCategory, { competitors, keywords, industry })}
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

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper, Target, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDashboardNews, NewsArticle } from '@/hooks/useDashboardNews';

interface NewsCardProps {
  article: NewsArticle;
}

function NewsCard({ article }: NewsCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block min-w-[280px] max-w-[280px] bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-32 bg-muted overflow-hidden">
        {!imageError ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Newspaper className="w-10 h-10 text-primary/40" />
          </div>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-xs"
        >
          {article.source}
        </Badge>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {article.summary}
        </p>
        <div className="flex items-center gap-1 text-xs text-primary">
          <span>Read more</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[280px] bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

interface NewsCarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  articles: NewsArticle[];
  isLoading: boolean;
}

function NewsCarouselSection({ title, icon, articles, isLoading }: NewsCarouselSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${title.replace(/\s+/g, '-')}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {isLoading ? '...' : articles.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div
        id={`carousel-${title.replace(/\s+/g, '-')}`}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          <>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))
        ) : (
          <div className="min-w-[280px] flex items-center justify-center h-48 bg-muted/50 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewsCarousel() {
  const { industryNews, competitorNews, isLoading, refetch } = useDashboardNews();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Market Intelligence</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <NewsCarouselSection
        title="Industry News"
        icon={<Newspaper className="w-5 h-5 text-primary" />}
        articles={industryNews}
        isLoading={isLoading}
      />

      <NewsCarouselSection
        title="Competitor Updates"
        icon={<Target className="w-5 h-5 text-amber-500" />}
        articles={competitorNews}
        isLoading={isLoading}
      />
    </div>
  );
}

import { useState } from 'react';
import { InsightCard } from '@/components/insights/InsightCard';
import { MarketNews } from '@/components/insights/MarketNews';
import { insights } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient } from '@/contexts/ClientContext';

const filterTypes = ['all', 'competitor', 'seo', 'product', 'industry', 'client'] as const;

export default function Insights() {
  const [activeFilter, setActiveFilter] = useState<(typeof filterTypes)[number]>('all');
  const { currentClient, clientConfig } = useClient();

  const filteredInsights =
    activeFilter === 'all'
      ? insights
      : insights.filter((insight) => insight.type === activeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {currentClient ? `${currentClient.name} Insights` : 'Insights'}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Market intelligence, competitive monitoring, and AI-detected opportunities.
          </p>
          {clientConfig?.competitors && clientConfig.competitors.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Monitoring:</span>
              {clientConfig.competitors.slice(0, 3).map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {c}
                </Badge>
              ))}
              {clientConfig.competitors.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{clientConfig.competitors.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="news" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="news" className="gap-2">
            Market News
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              Live
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="insights">Internal Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="mt-6">
          <MarketNews 
            competitors={clientConfig?.competitors}
            keywords={clientConfig?.market_news_keywords}
            industry={clientConfig?.industry}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterTypes.map((type) => (
              <Button
                key={type}
                variant={activeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className="capitalize"
              >
                {type}
                {type !== 'all' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {insights.filter((i) => i.type === type).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>

          {/* Empty State */}
          {filteredInsights.length === 0 && (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No insights found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

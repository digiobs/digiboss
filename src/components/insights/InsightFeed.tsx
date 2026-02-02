import { useMemo } from 'react';
import { BarChart3, Sparkles, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PerformanceInsight, ExternalInsight, OpsInsight, InsightsFilters } from '@/types/insights';
import { PerformanceInsightCard } from './PerformanceInsightCard';
import { ExternalInsightCard } from './ExternalInsightCard';
import { OpsInsightCard } from './OpsInsightCard';

interface InsightFeedProps {
  performanceInsights: PerformanceInsight[];
  externalInsights: ExternalInsight[];
  opsInsights: OpsInsight[];
  filters: InsightsFilters;
}

export function InsightFeed({
  performanceInsights,
  externalInsights,
  opsInsights,
  filters,
}: InsightFeedProps) {
  // Filter insights based on current filters
  const filteredPerformance = useMemo(() => {
    let filtered = performanceInsights;
    
    if (filters.theme !== 'all') {
      filtered = filtered.filter((i) => i.theme === filters.theme);
    }
    if (filters.impact !== 'all') {
      filtered = filtered.filter((i) => i.impact === filters.impact);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.tldr.toLowerCase().includes(query) ||
          i.soWhat.toLowerCase().includes(query)
      );
    }
    
    // Sort by score descending
    return [...filtered].sort((a, b) => b.score - a.score);
  }, [performanceInsights, filters]);

  const filteredExternal = useMemo(() => {
    let filtered = externalInsights;
    
    if (filters.theme !== 'all') {
      filtered = filtered.filter((i) => i.theme === filters.theme);
    }
    if (filters.impact !== 'all') {
      filtered = filtered.filter((i) => i.impact === filters.impact);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.tldr.toLowerCase().includes(query) ||
          i.soWhat.toLowerCase().includes(query) ||
          i.perplexityQuestion.toLowerCase().includes(query)
      );
    }
    
    // Separate verified and unverified
    const verified = filtered.filter((i) => i.isVerified);
    const unverified = filtered.filter((i) => !i.isVerified);
    
    return {
      verified: [...verified].sort((a, b) => b.score - a.score),
      unverified: [...unverified].sort((a, b) => b.score - a.score),
    };
  }, [externalInsights, filters]);

  const filteredOps = useMemo(() => {
    let filtered = opsInsights;
    
    if (filters.impact !== 'all') {
      filtered = filtered.filter((i) => i.impact === filters.impact);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query)
      );
    }
    
    return [...filtered].sort((a, b) => b.score - a.score);
  }, [opsInsights, filters]);

  // Combined view for "all" or when specific source is selected
  const showPerformance = filters.source === 'all' || filters.source === 'performance';
  const showExternal = filters.source === 'all' || filters.source === 'external';
  const showOps = filters.source === 'all' || filters.source === 'ops';

  const totalHighValue = filteredPerformance.length + filteredExternal.verified.length + filteredOps.length;
  const totalOthers = filteredExternal.unverified.length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="high-value" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="high-value" className="gap-2">
              High Value
              <Badge variant="secondary" className="text-xs">
                {totalHighValue}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="others" className="gap-2">
              Others
              <Badge variant="secondary" className="text-xs">
                {totalOthers}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="high-value" className="mt-6 space-y-8">
          {/* Performance Insights */}
          {showPerformance && filteredPerformance.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">Performance Insights</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredPerformance.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPerformance.map((insight) => (
                  <PerformanceInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* External Insights (Perplexity) - Verified only */}
          {showExternal && filteredExternal.verified.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">External Insights (Perplexity)</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredExternal.verified.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredExternal.verified.map((insight) => (
                  <ExternalInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Ops Insights */}
          {showOps && filteredOps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-foreground">Ops Insights</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredOps.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOps.map((insight) => (
                  <OpsInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalHighValue === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No insights found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="others" className="mt-6 space-y-8">
          {/* Unverified External Insights */}
          {filteredExternal.unverified.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-foreground">Needs Verification</h3>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {filteredExternal.unverified.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                These insights lack sufficient citations and need verification before acting on them.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredExternal.unverified.map((insight) => (
                  <ExternalInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No unverified insights</h3>
              <p className="text-muted-foreground">
                All current insights are verified with citations.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

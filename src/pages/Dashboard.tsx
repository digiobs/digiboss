import { KPICard } from '@/components/dashboard/KPICard';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { NewsCarousel } from '@/components/dashboard/NewsCarousel';
import { BlogPostsWidget } from '@/components/dashboard/BlogPostsWidget';
import { kpis, recommendations } from '@/data/mockData';
import { Zap } from 'lucide-react';
import { useClient } from '@/contexts/ClientContext';

export default function Dashboard() {
  const { currentClient, clientConfig } = useClient();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {currentClient ? `${currentClient.name} Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your marketing command center. Here's what matters most.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Market Intelligence - News Carousels */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <NewsCarousel 
          competitors={clientConfig?.competitors} 
          industry={clientConfig?.industry}
          keywords={clientConfig?.market_news_keywords}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Summary */}
        <div className="lg:col-span-1">
          <WeeklySummary />
        </div>

        {/* Next Best Actions */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Next Best Actions</h2>
            <span className="text-sm text-muted-foreground ml-auto">
              {recommendations.filter((r) => r.status === 'new').length} pending
            </span>
          </div>
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec, index) => (
              <RecommendationCard key={rec.id} recommendation={rec} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlogPostsWidget />
      </div>
    </div>
  );
}
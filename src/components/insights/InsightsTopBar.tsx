import { useState } from 'react';
import { Search, Filter, Calendar, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClient } from '@/contexts/ClientContext';
import type { InsightsFilters, InsightSourceFilter, InsightThemeFilter, InsightImpactFilter, InsightStatusFilter } from '@/types/insights';

interface InsightsTopBarProps {
  filters: InsightsFilters;
  onFiltersChange: (filters: InsightsFilters) => void;
}

const sourceOptions: { value: InsightSourceFilter; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'meetings', label: 'Meetings' },
  { value: 'performance', label: 'Performance' },
  { value: 'external', label: 'External (Perplexity)' },
  { value: 'ops', label: 'Ops' },
];

const themeOptions: { value: InsightThemeFilter; label: string }[] = [
  { value: 'all', label: 'All Themes' },
  { value: 'seo', label: 'SEO' },
  { value: 'content', label: 'Content' },
  { value: 'paid', label: 'Paid' },
  { value: 'social', label: 'Social' },
  { value: 'cro', label: 'CRO' },
  { value: 'crm', label: 'CRM' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'brand', label: 'Brand' },
];

const impactOptions: { value: InsightImpactFilter; label: string }[] = [
  { value: 'all', label: 'All Impact' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const statusOptions: { value: InsightStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'actioned', label: 'Actioned' },
  { value: 'archived', label: 'Archived' },
];

export function InsightsTopBar({ filters, onFiltersChange }: InsightsTopBarProps) {
  const { currentClient, clients } = useClient();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const activeFiltersCount = [
    filters.source !== 'all',
    filters.theme !== 'all',
    filters.impact !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border -mx-6 px-6 py-4 space-y-4">
      {/* Main row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Workspace selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <Select value={currentClient?.id || ''}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="none">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No comparison</SelectItem>
              <SelectItem value="previous">Previous period</SelectItem>
              <SelectItem value="yoy">Year over year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings, transcripts, articles..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap animate-in slide-in-from-top-2 duration-200">
          <Select
            value={filters.source}
            onValueChange={(value: InsightSourceFilter) =>
              onFiltersChange({ ...filters, source: value })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.theme}
            onValueChange={(value: InsightThemeFilter) =>
              onFiltersChange({ ...filters, theme: value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.impact}
            onValueChange={(value: InsightImpactFilter) =>
              onFiltersChange({ ...filters, impact: value })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {impactOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value: InsightStatusFilter) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  source: 'all',
                  theme: 'all',
                  impact: 'all',
                  status: 'all',
                  search: filters.search,
                })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

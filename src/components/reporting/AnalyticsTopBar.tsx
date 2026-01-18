import { Calendar, Download, Filter, RefreshCw, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { filterOptions } from '@/data/analyticsData';
import { useState } from 'react';

interface AnalyticsTopBarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  compareMode: string;
  onCompareModeChange: (value: string) => void;
}

export function AnalyticsTopBar({
  dateRange,
  onDateRangeChange,
  compareMode,
  onCompareModeChange,
}: AnalyticsTopBarProps) {
  const [activeFilters, setActiveFilters] = useState(0);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border py-3 -mx-6 px-6 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Date Controls */}
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-44">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={compareMode} onValueChange={onCompareModeChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Compare to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous period</SelectItem>
              <SelectItem value="year">Previous year</SelectItem>
              <SelectItem value="none">No comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Center: Filters */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Country / Region</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.countries.slice(0, 4).map((country) => (
                      <div key={country} className="flex items-center gap-2">
                        <Checkbox id={country} />
                        <Label htmlFor={country} className="text-sm font-normal">
                          {country}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Device</h4>
                  <div className="flex gap-2">
                    {filterOptions.devices.map((device) => (
                      <div key={device} className="flex items-center gap-2">
                        <Checkbox id={device} />
                        <Label htmlFor={device} className="text-sm font-normal">
                          {device}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Channel</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.channels.slice(0, 6).map((channel) => (
                      <div key={channel} className="flex items-center gap-2">
                        <Checkbox id={channel} />
                        <Label htmlFor={channel} className="text-sm font-normal text-xs">
                          {channel}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm">
                    Clear all
                  </Button>
                  <Button size="sm">Apply filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30">
            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Conversions:</span>
            <Badge variant="secondary" className="text-xs">Contact forms</Badge>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

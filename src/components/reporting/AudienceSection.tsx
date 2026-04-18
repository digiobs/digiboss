import { Globe, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function AudienceSection() {
  const { hasData } = useReportingMetrics(['website']);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Audience & Targeting</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Audience data not yet connected.</p>
          <p className="text-xs text-muted-foreground mt-1">Geographic and device data requires GA4 audience sync.</p>
        </div>
      </div>
    </div>
  );
}

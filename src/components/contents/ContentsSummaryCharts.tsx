import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Content } from '@/hooks/useContents';
import { format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

function getLatestMetric(c: Content) {
  if (!c.content_metrics?.length) return null;
  return c.content_metrics.reduce((a, b) =>
    new Date(a.measured_at) > new Date(b.measured_at) ? a : b
  );
}

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  blog: '#059669',
  youtube: '#DC2626',
  newsletter: '#7C3AED',
};

export function ContentsSummaryCharts({ contents, isLoading }: { contents: Content[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  // Group by week
  const weekMap: Record<string, Record<string, number>> = {};
  const engagementMap: Record<string, Record<string, { sum: number; count: number }>> = {};

  contents.forEach(c => {
    const weekStart = format(startOfWeek(new Date(c.published_at), { weekStartsOn: 1 }), 'dd MMM', { locale: fr });
    if (!weekMap[weekStart]) weekMap[weekStart] = { linkedin: 0, blog: 0, youtube: 0, newsletter: 0 };
    weekMap[weekStart][c.channel] = (weekMap[weekStart][c.channel] || 0) + 1;

    const m = getLatestMetric(c);
    if (m) {
      if (!engagementMap[weekStart]) engagementMap[weekStart] = {};
      if (!engagementMap[weekStart][c.channel]) engagementMap[weekStart][c.channel] = { sum: 0, count: 0 };
      engagementMap[weekStart][c.channel].sum += m.engagement_rate;
      engagementMap[weekStart][c.channel].count += 1;
    }
  });

  const volumeData = Object.entries(weekMap).map(([week, channels]) => ({ week, ...channels }));
  const engagementData = Object.entries(engagementMap).map(([week, channels]) => {
    const row: Record<string, string | number> = { week };
    Object.entries(channels).forEach(([ch, { sum, count }]) => {
      row[ch] = Number((sum / count).toFixed(1));
    });
    return row;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Volume de publication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="linkedin" stackId="a" fill={CHANNEL_COLORS.linkedin} name="LinkedIn" radius={[0, 0, 0, 0]} />
                <Bar dataKey="blog" stackId="a" fill={CHANNEL_COLORS.blog} name="Blog" />
                <Bar dataKey="youtube" stackId="a" fill={CHANNEL_COLORS.youtube} name="YouTube" />
                <Bar dataKey="newsletter" stackId="a" fill={CHANNEL_COLORS.newsletter} name="Newsletter" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Engagement par canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="linkedin" stroke={CHANNEL_COLORS.linkedin} strokeWidth={2} dot={false} name="LinkedIn" />
                <Line type="monotone" dataKey="blog" stroke={CHANNEL_COLORS.blog} strokeWidth={2} dot={false} name="Blog" />
                <Line type="monotone" dataKey="youtube" stroke={CHANNEL_COLORS.youtube} strokeWidth={2} dot={false} name="YouTube" />
                <Line type="monotone" dataKey="newsletter" stroke={CHANNEL_COLORS.newsletter} strokeWidth={2} dot={false} name="Newsletter" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

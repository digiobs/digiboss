import { Globe, MapPin, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { audienceByCountry, audienceByRegion, audienceByCity, deviceBreakdown } from '@/data/analyticsData';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from '@/components/ui/chart';

const deviceColors = {
  Desktop: 'hsl(221, 83%, 53%)',
  Mobile: 'hsl(142, 76%, 36%)',
  Tablet: 'hsl(38, 92%, 50%)',
};

const deviceIcons = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

export function AudienceSection() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Audience & Targeting</h2>
          <Badge variant="secondary" className="text-xs">Who is visiting</Badge>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Geography Tables */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="country">
              <TabsList className="mb-4">
                <TabsTrigger value="country">By Country</TabsTrigger>
                <TabsTrigger value="region">By Region</TabsTrigger>
                <TabsTrigger value="city">By City</TabsTrigger>
              </TabsList>

              <TabsContent value="country">
                <GeoTable data={audienceByCountry} />
              </TabsContent>
              <TabsContent value="region">
                <GeoTable data={audienceByRegion} />
              </TabsContent>
              <TabsContent value="city">
                <GeoTable data={audienceByCity} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Device Split */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Device Split</h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="share"
                    nameKey="device"
                  >
                    {deviceBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={deviceColors[entry.device as keyof typeof deviceColors]} 
                      />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {deviceBreakdown.map((device, index) => {
                const Icon = deviceIcons[device.device as keyof typeof deviceIcons];
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span>{device.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{device.users.toLocaleString()}</span>
                      <Badge variant="secondary" className="text-xs">{device.share}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeoTable({ data }: { data: typeof audienceByCountry }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Location</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Users</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sessions</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {row.location}
                </div>
              </td>
              <td className="px-3 py-2 text-right">{row.users.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{row.sessions.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-12 text-right">{row.share}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

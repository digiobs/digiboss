import { Mail, Linkedin, Phone, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Lead } from '@/data/mockData';

interface LeadTableProps {
  leads: Lead[];
}

const stageLabels = {
  new: { label: 'Nouveau', class: 'status-new' },
  contacted: { label: 'Contacte', class: 'status-in-progress' },
  qualified: { label: 'Qualifie', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  proposal: { label: 'Proposition', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  closed: { label: 'Ferme', class: 'status-completed' },
};

const channelIcons = {
  email: Mail,
  linkedin: Linkedin,
  call: Phone,
};

const SOURCE_COLORS: Record<string, string> = {
  lemlist: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  hubspot: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function formatActivity(value: string): string {
  if (!value || value === 'NA') return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
        Aucun contact trouve pour ces filtres.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Contact
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Source
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Score
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Etape
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Scores details
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Action suivante
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const stageInfo = stageLabels[lead.stage];
              const ChannelIcon = channelIcons[lead.suggestedChannel];
              const sourceClass = SOURCE_COLORS[lead.source.toLowerCase()] ?? 'bg-muted text-muted-foreground';

              return (
                <tr key={lead.id} className="lead-row">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.company}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatActivity(lead.lastActivity)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className={cn('text-xs', sourceClass)}>
                      {lead.source}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                          lead.score >= 80
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : lead.score >= 60
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {lead.score}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className={stageInfo.class}>
                      {stageInfo.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5 w-32">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fit</span>
                        <span>{lead.fitScore}</span>
                      </div>
                      <Progress value={lead.fitScore} className="h-1" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Intent</span>
                        <span>{lead.intentScore}</span>
                      </div>
                      <Progress value={lead.intentScore} className="h-1" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Engage</span>
                        <span>{lead.engagementScore}</span>
                      </div>
                      <Progress value={lead.engagementScore} className="h-1" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <ChannelIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-foreground max-w-48">{lead.suggestedAction}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button size="sm" variant="outline" className="gap-1">
                      Voir
                      <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

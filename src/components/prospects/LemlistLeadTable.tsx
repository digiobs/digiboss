import { Send, Eye, MousePointer, Reply, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { LemlistContactRow } from '@/hooks/useLemlistContacts';

interface LemlistLeadTableProps {
  contacts: LemlistContactRow[];
  onSelect: (contact: LemlistContactRow) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  opened: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  clicked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  replied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  interested: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  bounced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  unsubscribed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function statusClass(status: string | null): string {
  if (!status) return STATUS_COLORS.new;
  const key = status.toLowerCase();
  for (const [k, v] of Object.entries(STATUS_COLORS)) {
    if (key.includes(k)) return v;
  }
  return STATUS_COLORS.new;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.round(days / 30);
  return `il y a ${months} mois`;
}

function FunnelPill({
  icon: Icon,
  value,
  label,
  active,
}: {
  icon: typeof Send;
  value: number;
  label: string;
  active: boolean;
}) {
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]',
        active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
}

export function LemlistLeadTable({ contacts, onSelect }: LemlistLeadTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
        Aucun contact à afficher pour cette campagne.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Campagne</TableHead>
            <TableHead>Étape</TableHead>
            <TableHead>Funnel</TableHead>
            <TableHead>Dernier événement</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {contact.full_name || contact.email || 'Contact sans nom'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contact.email ?? '—'}
                    {contact.company ? ` · ${contact.company}` : ''}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {contact.campaign_name ? (
                  <Badge variant="secondary" className="text-xs">
                    {contact.campaign_name}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                Étape {contact.current_step ?? 0}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <FunnelPill icon={Send} value={contact.emails_sent} label="Envoyés" active={contact.emails_sent > 0} />
                  <FunnelPill icon={Eye} value={contact.emails_opened} label="Ouverts" active={contact.emails_opened > 0} />
                  <FunnelPill
                    icon={MousePointer}
                    value={contact.emails_clicked}
                    label="Cliqués"
                    active={contact.emails_clicked > 0}
                  />
                  <FunnelPill
                    icon={Reply}
                    value={contact.emails_replied}
                    label="Réponses"
                    active={contact.emails_replied > 0}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span>{contact.last_event_type ?? '—'}</span>
                  <span className="text-muted-foreground">
                    {formatRelative(contact.last_event_at ?? contact.contacted_at)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn('text-[11px]', statusClass(contact.status))}>
                  {contact.status ?? 'new'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-7 px-2 text-xs"
                  onClick={() => onSelect(contact)}
                >
                  Voir
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

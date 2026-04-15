import { useMemo, useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, Send, Eye, MousePointer, Reply } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LemlistContactRow } from '@/hooks/useLemlistContacts';

interface LemlistLeadDrawerProps {
  contact: LemlistContactRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function LemlistLeadDrawer({ contact, open, onOpenChange }: LemlistLeadDrawerProps) {
  const [showRaw, setShowRaw] = useState(false);

  const lemlistUrl = useMemo(() => {
    if (!contact?.campaign_id || !contact?.external_contact_id) return null;
    return `https://app.lemlist.com/campaigns/${contact.campaign_id}/leads/${contact.external_contact_id}`;
  }, [contact?.campaign_id, contact?.external_contact_id]);

  if (!contact) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto" />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact.full_name || contact.email || 'Contact lemlist'}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {contact.email && <span>{contact.email}</span>}
            {contact.company && <span>· {contact.company}</span>}
            {contact.campaign_name && (
              <Badge variant="secondary" className="text-xs">
                {contact.campaign_name}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold mb-2">Synthèse</h3>
            <div className="grid grid-cols-2 gap-2">
              <SummaryStat icon={Send} label="Envoyés" value={contact.emails_sent} />
              <SummaryStat icon={Eye} label="Ouverts" value={contact.emails_opened} />
              <SummaryStat icon={MousePointer} label="Cliqués" value={contact.emails_clicked} />
              <SummaryStat icon={Reply} label="Réponses" value={contact.emails_replied} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Étape courante</dt>
              <dd className="text-right">{contact.current_step ?? 0}</dd>
              <dt className="text-muted-foreground">Dernier événement</dt>
              <dd className="text-right">{contact.last_event_type ?? '—'}</dd>
              <dt className="text-muted-foreground">Dernier événement (date)</dt>
              <dd className="text-right">{formatDate(contact.last_event_at)}</dd>
              <dt className="text-muted-foreground">Contacté le</dt>
              <dd className="text-right">{formatDate(contact.contacted_at)}</dd>
              <dt className="text-muted-foreground">Synchronisé</dt>
              <dd className="text-right">{formatDate(contact.synced_at)}</dd>
              <dt className="text-muted-foreground">Statut</dt>
              <dd className="text-right">
                <Badge variant="outline" className="text-[11px]">
                  {contact.status ?? 'new'}
                </Badge>
              </dd>
            </dl>
          </section>

          <section>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Payload brut lemlist
            </button>
            {showRaw && (
              <pre className="mt-2 max-h-[360px] overflow-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug">
                {JSON.stringify(contact.raw ?? {}, null, 2)}
              </pre>
            )}
          </section>

          {lemlistUrl && (
            <div>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={lemlistUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ouvrir dans lemlist
                </a>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

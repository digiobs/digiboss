import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Pencil,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreativeProposal } from '@/hooks/useCreativeProposals';

const urgencyClass: Record<string, string> = {
  '🔴 Critique':
    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  '🟠 Urgent':
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  '🟡 Important':
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  '🟢 Normal':
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const statusPill: Record<
  string,
  { label: string; className: string; icon?: typeof Lightbulb }
> = {
  new: {
    label: 'En attente',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: Lightbulb,
  },
  pending: {
    label: 'En attente',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: Lightbulb,
  },
  approved: {
    label: 'Validée',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  ready_to_publish: {
    label: 'À publier',
    className:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    icon: Rocket,
  },
  published: {
    label: 'Publiée',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejetée',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: XCircle,
  },
};

export interface ProposalMiniCardProps {
  proposal: CreativeProposal;
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (proposal: CreativeProposal) => void;
}

/**
 * Compact proposal card used inside a monthly package on the /actions page.
 * Surfaces the exact source ("d'où vient l'idée") and keeps the validation
 * actions one click away for admins.
 */
export function ProposalMiniCard({
  proposal,
  isAdmin,
  onApprove,
  onReject,
  onEdit,
}: ProposalMiniCardProps) {
  const [expanded, setExpanded] = useState(false);
  const age = formatDistanceToNow(new Date(proposal.created_at), {
    locale: fr,
    addSuffix: true,
  });
  const urgencyCls = urgencyClass[proposal.urgency] ?? urgencyClass['🟢 Normal'];
  const pill = statusPill[proposal.status] ?? statusPill.pending;
  const PillIcon = pill.icon;

  return (
    <div className="rounded-lg border border-amber-200/60 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge
              variant="outline"
              className={cn('text-[10px] border-0', pill.className)}
            >
              {PillIcon && <PillIcon className="w-3 h-3 mr-1" />}
              {pill.label}
            </Badge>
            <Badge variant="outline" className={cn('text-[10px] border-0', urgencyCls)}>
              {proposal.urgency.replace(/[^\p{L} ]/gu, '').trim() || 'Normal'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Source: {proposal.source_skill}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {proposal.title}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {age} · {proposal.proposal_type} → {proposal.target_skill}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-1 hover:bg-accent rounded"
          aria-label={expanded ? 'Réduire' : 'Développer'}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2">
          <p className="text-xs text-foreground">{proposal.description}</p>
          {proposal.rationale && (
            <div className="bg-white/60 dark:bg-black/20 rounded p-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                Justification
              </p>
              <p className="text-xs">{proposal.rationale}</p>
            </div>
          )}
          {proposal.source_insight && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 border border-blue-200 dark:border-blue-800">
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mb-0.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Source de l'insight
              </p>
              <p className="text-xs">{proposal.source_insight}</p>
              {proposal.source_url && (
                <a
                  href={proposal.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Voir la source
                </a>
              )}
            </div>
          )}
          {proposal.wrike_permalink && (
            <a
              href={proposal.wrike_permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Voir la tâche dans Wrike
            </a>
          )}
        </div>
      )}

      {isAdmin &&
        (proposal.status === 'new' || proposal.status === 'pending') && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onApprove(proposal.id)}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valider
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => onReject(proposal.id)}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Rejeter
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => onEdit(proposal)}
              title="Convertir en action"
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </div>
        )}
    </div>
  );
}

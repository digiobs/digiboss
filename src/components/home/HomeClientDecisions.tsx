import { useNavigate } from 'react-router-dom';
import { useCreativeProposals } from '@/hooks/useCreativeProposals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Sparkles, CheckCircle2, XCircle, ChevronRight, Bell } from 'lucide-react';
import { toast } from 'sonner';

const URGENCY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
};

const URGENCY_LABEL: Record<string, string> = {
  high: 'Urgent',
  medium: 'Moyen',
  low: 'Faible',
};

export function HomeClientDecisions() {
  const navigate = useNavigate();
  const { convergences, proposalsByStatus, isLoading, updateProposalStatus, approveAndPushToWrike } =
    useCreativeProposals();

  const pending = proposalsByStatus?.enAttente ?? [];
  const activeConvergences = convergences.filter((c) => c.status !== 'resolved');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Chargement des propositions...
      </div>
    );
  }

  const totalDecisions = pending.length + activeConvergences.length;

  if (totalDecisions === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500/60" />
        <p className="text-sm font-medium text-foreground">Tout est a jour</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Aucune proposition en attente de validation.
        </p>
      </div>
    );
  }

  const handleApprove = async (proposalId: string) => {
    try {
      await approveAndPushToWrike(proposalId);
      toast.success('Proposition validee');
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await updateProposalStatus(proposalId, 'rejected');
      toast.success('Proposition rejetee');
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {totalDecisions} decision{totalDecisions > 1 ? 's' : ''} en attente
          </span>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/actions')}>
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {activeConvergences.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Convergences multi-skills
          </p>
          {activeConvergences.slice(0, 3).map((conv) => (
            <Card
              key={conv.id}
              className="border-indigo-200/70 bg-indigo-50/30 dark:border-indigo-800/50 dark:bg-indigo-950/20"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Layers className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium leading-snug">{conv.combined_title}</p>
                    {conv.combined_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {conv.combined_description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        Confiance {Math.round((conv.confidence ?? 0) * 100)}%
                      </Badge>
                      {(conv.source_skills ?? []).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {String(skill)}
                        </Badge>
                      ))}
                    </div>
                    {conv.combined_action && (
                      <div className="rounded-md bg-indigo-100/60 p-2 dark:bg-indigo-900/30">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                          Action recommandee
                        </p>
                        <p className="mt-0.5 text-xs">{conv.combined_action}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Propositions a valider
          </p>
          {pending.slice(0, 5).map((proposal) => (
            <Card key={proposal.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{proposal.title}</p>
                      <Badge
                        variant={URGENCY_VARIANT[proposal.urgency] ?? 'outline'}
                        className="shrink-0 text-[10px]"
                      >
                        {URGENCY_LABEL[proposal.urgency] ?? proposal.urgency}
                      </Badge>
                    </div>
                    {proposal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {proposal.description}
                      </p>
                    )}
                    {proposal.rationale && (
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-[10px] font-medium text-muted-foreground">Pourquoi ?</p>
                        <p className="mt-0.5 text-xs">{proposal.rationale}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {proposal.source_skill && (
                        <Badge variant="secondary" className="text-[10px]">
                          {proposal.source_skill}
                        </Badge>
                      )}
                      {proposal.target_skill && (
                        <Badge variant="outline" className="text-[10px]">
                          {proposal.target_skill}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleApprove(proposal.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleReject(proposal.id)}
                      >
                        <XCircle className="h-3 w-3" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

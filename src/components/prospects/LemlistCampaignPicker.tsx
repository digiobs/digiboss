import { useMemo, useState } from 'react';
import { Link2, Unlink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLemlistCampaignList, type LemlistCampaign } from '@/hooks/useLemlistCampaignList';
import type { LemlistMapping } from '@/hooks/useLemlistCampaignMapping';

interface LemlistCampaignPickerProps {
  mapping: LemlistMapping | null;
  enabled: boolean;
  clientName: string | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: (campaign: LemlistCampaign) => void;
  onDisconnect: () => void;
}

/** Strip accents, lowercase, reduce non-alphanumerics to single spaces. */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function LemlistCampaignPicker({
  mapping,
  enabled,
  clientName,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: LemlistCampaignPickerProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const { campaigns, isLoading, error, refetch } = useLemlistCampaignList(enabled);

  // Tokens from the client name that we'll use to prefilter. Keep tokens of
  // length >= 3 so single letters and noise like "de", "la" don't match
  // everything.
  const clientTokens = useMemo(() => {
    if (!clientName) return [] as string[];
    return normalizeText(clientName)
      .split(/\s+/)
      .filter((t) => t.length >= 3);
  }, [clientName]);

  // Two-stage matching:
  //   1. Prefer campaigns whose *team name* matches the client (multi-team
  //      setups: "Team Acme" ↔ client "Acme Co").
  //   2. Fall back to the legacy *campaign name* match when no team matches.
  // The stage 1 result is preferred whenever non-empty so routing stays
  // deterministic even when a campaign happens to include client tokens
  // across multiple teams.
  const { matchedCampaigns, matchKind } = useMemo<{
    matchedCampaigns: typeof campaigns;
    matchKind: 'team' | 'name' | 'none';
  }>(() => {
    if (clientTokens.length === 0) {
      return { matchedCampaigns: campaigns, matchKind: 'none' };
    }
    const byTeam = campaigns.filter((c) => {
      const normalized = normalizeText(c.team_name ?? '');
      if (!normalized) return false;
      return clientTokens.some((token) => normalized.includes(token));
    });
    if (byTeam.length > 0) {
      return { matchedCampaigns: byTeam, matchKind: 'team' };
    }
    const byName = campaigns.filter((c) => {
      const normalized = normalizeText(c.name);
      return clientTokens.some((token) => normalized.includes(token));
    });
    if (byName.length > 0) {
      return { matchedCampaigns: byName, matchKind: 'name' };
    }
    return { matchedCampaigns: campaigns, matchKind: 'none' };
  }, [campaigns, clientTokens]);

  const displayedCampaigns = showAll || matchKind === 'none' ? campaigns : matchedCampaigns;
  const hasClientFilter = matchKind !== 'none' && matchedCampaigns.length !== campaigns.length;

  const selected = displayedCampaigns.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Campagne lemlist</span>
          {mapping ? (
            <Badge variant="secondary" className="text-xs">
              {mapping.external_account_name ?? mapping.external_account_id}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Aucune campagne connectée</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-7 px-2 text-xs"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Rafraîchir la liste
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600">Erreur lemlist : {error}</p>
      )}

      <div className="flex items-center gap-2">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="h-8 flex-1 min-w-[220px] text-xs">
            <SelectValue
              placeholder={isLoading ? 'Chargement des campagnes…' : 'Sélectionner une campagne'}
            />
          </SelectTrigger>
          <SelectContent>
            {displayedCampaigns.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.team_name ? (
                  <span>
                    <span className="text-muted-foreground">{c.team_name} · </span>
                    {c.name}
                  </span>
                ) : (
                  c.name
                )}
              </SelectItem>
            ))}
            {displayedCampaigns.length === 0 && !isLoading && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Aucune campagne disponible
              </div>
            )}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="gap-1.5 h-8"
          onClick={() => selected && onConnect(selected)}
          disabled={!selected || isConnecting}
        >
          <Link2 className="w-3.5 h-3.5" />
          {isConnecting ? 'Connexion…' : 'Connecter'}
        </Button>
        {mapping && (
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5 h-8"
            onClick={onDisconnect}
            disabled={isDisconnecting}
          >
            <Unlink className="w-3.5 h-3.5" />
            {isDisconnecting ? 'Déconnexion…' : 'Déconnecter'}
          </Button>
        )}
      </div>

      {hasClientFilter && !isLoading && campaigns.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {showAll
              ? `${campaigns.length} campagne${campaigns.length > 1 ? 's' : ''} au total`
              : `${matchedCampaigns.length} correspondance${matchedCampaigns.length > 1 ? 's' : ''} ${
                  matchKind === 'team' ? 'par équipe' : 'par nom'
                } pour « ${clientName} » sur ${campaigns.length}`}
          </span>
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Filtrer par client' : 'Voir toutes les campagnes'}
          </button>
        </div>
      )}
    </div>
  );
}

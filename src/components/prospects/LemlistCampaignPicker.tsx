import { useState } from 'react';
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
import { useLemlistCampaignList } from '@/hooks/useLemlistCampaignList';
import type { LemlistMapping } from '@/hooks/useLemlistCampaignMapping';

interface LemlistCampaignPickerProps {
  mapping: LemlistMapping | null;
  enabled: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: (campaign: { id: string; name: string }) => void;
  onDisconnect: () => void;
}

export function LemlistCampaignPicker({
  mapping,
  enabled,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: LemlistCampaignPickerProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const { campaigns, isLoading, error, refetch } = useLemlistCampaignList(enabled);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

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
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
            {campaigns.length === 0 && !isLoading && (
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
    </div>
  );
}

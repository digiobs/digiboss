import { useEffect, useState, useCallback } from 'react';
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Unplug,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type IntegrationStatus = {
  provider: string;
  api_host: string | null;
  expires_at: string | null;
  scope: string | null;
  connected_at: string | null;
  updated_at: string | null;
  is_active: boolean;
};

const sb = supabase as unknown as {
  from: (t: string) => {
    select: (q: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: IntegrationStatus | null; error: { message: string } | null }>;
      };
    };
  };
};

export default function SettingsIntegrations() {
  const [wrikeStatus, setWrikeStatus] = useState<IntegrationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    const { data, error } = await sb
      .from('app_integration_status')
      .select('provider, api_host, expires_at, scope, connected_at, updated_at, is_active')
      .eq('provider', 'wrike')
      .maybeSingle();
    if (error) {
      console.warn('Failed to load integration status:', error.message);
    }
    setWrikeStatus(data ?? null);
    setIsLoadingStatus(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnectWrike = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('wrike-oauth-start', {
        body: { redirectTo: '/settings/integrations' },
      });
      if (error) throw error;
      const authorizeUrl = (data as { authorizeUrl?: string })?.authorizeUrl;
      if (!authorizeUrl) {
        throw new Error("Réponse invalide de wrike-oauth-start");
      }
      // Full-page redirect to Wrike's consent screen.
      window.location.href = authorizeUrl;
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Impossible de démarrer la connexion Wrike : ${message}`);
      setIsConnecting(false);
    }
  };

  const handleDisconnectWrike = async () => {
    if (!confirm('Déconnecter Wrike ? Les synchronisations échoueront jusqu\'à la prochaine connexion.')) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('wrike-oauth-disconnect', {
        body: {},
      });
      if (error) throw error;
      toast.success('Wrike déconnecté');
      await loadStatus();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la déconnexion : ${message}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isWrikeConnected = Boolean(wrikeStatus?.is_active);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" />
          Intégrations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connectez les outils externes utilisés par l'application. Chaque connexion est globale et
          partagée pour tous les clients.
        </p>
      </div>

      {/* Wrike */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Wrike</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gestion de projet · sync des tâches et des propositions de contenus
                </p>
              </div>
            </div>
            {isLoadingStatus ? (
              <Badge variant="secondary">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Vérification…
              </Badge>
            ) : isWrikeConnected ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <AlertCircle className="w-3 h-3 mr-1" />
                Non connecté
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {isWrikeConnected && wrikeStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-muted/40 rounded-lg p-3">
              <div>
                <p className="text-muted-foreground">Hôte API</p>
                <p className="font-medium mt-0.5">{wrikeStatus.api_host ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Connecté</p>
                <p className="font-medium mt-0.5">
                  {wrikeStatus.connected_at
                    ? formatDistanceToNow(new Date(wrikeStatus.connected_at), {
                        locale: fr,
                        addSuffix: true,
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Token expire</p>
                <p className="font-medium mt-0.5">
                  {wrikeStatus.expires_at
                    ? formatDistanceToNow(new Date(wrikeStatus.expires_at), {
                        locale: fr,
                        addSuffix: true,
                      })
                    : 'jamais'}
                </p>
              </div>
            </div>
          )}

          {!isWrikeConnected && !isLoadingStatus && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-2">
              <p>
                Cliquez sur <strong>Connecter Wrike</strong> pour autoriser DigiObs à accéder à votre
                workspace Wrike. Vous serez redirigé vers la page de connexion de Wrike.
              </p>
              <p>
                Une OAuth app doit être créée côté Wrike (
                <a
                  href="https://www.wrike.com/frontend/apps/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Apps & Integrations
                  <ExternalLink className="w-3 h-3" />
                </a>
                ) et les secrets <code className="bg-background px-1 rounded">WRIKE_OAUTH_CLIENT_ID</code>,{' '}
                <code className="bg-background px-1 rounded">WRIKE_OAUTH_CLIENT_SECRET</code>,{' '}
                <code className="bg-background px-1 rounded">WRIKE_OAUTH_REDIRECT_URI</code> doivent
                être configurés dans Supabase.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!isWrikeConnected ? (
              <Button
                onClick={handleConnectWrike}
                disabled={isConnecting || isLoadingStatus}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                Connecter Wrike
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleConnectWrike}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LinkIcon className="w-4 h-4 mr-2" />
                  )}
                  Reconnecter
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnectWrike}
                  disabled={isDisconnecting}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4 mr-2" />
                  )}
                  Déconnecter
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

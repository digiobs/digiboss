import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Unplug,
  Building2,
  FolderTree,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClient } from '@/contexts/ClientContext';

type IntegrationStatus = {
  provider: string;
  api_host: string | null;
  expires_at: string | null;
  scope: string | null;
  connected_at: string | null;
  updated_at: string | null;
  is_active: boolean;
};

type WrikeFolder = {
  id: string;
  title: string;
  scope?: string;
  project?: { status?: string } | null;
};

type ClientWrikeMapping = {
  client_id: string;
  external_account_id: string | null;
  external_account_name: string | null;
};

// Relaxed typed wrapper so we can hit tables and views not yet present
// in the generated Database types.
type DbLike = {
  from: (t: string) => {
    select: (q: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
      order?: (col: string, opts: { ascending: boolean }) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
    upsert: (
      values: Record<string, unknown>,
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
    delete: () => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
};

const sb = supabase as unknown as DbLike;

const UNSET_FOLDER_VALUE = '__unset__';

export default function SettingsIntegrations() {
  const { clients } = useClient();
  const [wrikeStatus, setWrikeStatus] = useState<IntegrationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Client → Wrike folder mapping state
  const [wrikeFolders, setWrikeFolders] = useState<WrikeFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [clientMappings, setClientMappings] = useState<Record<string, ClientWrikeMapping>>({});
  const [savingClientId, setSavingClientId] = useState<string | null>(null);

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
    setWrikeStatus((data as IntegrationStatus | null) ?? null);
    setIsLoadingStatus(false);
  }, []);

  const loadClientMappings = useCallback(async () => {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (q: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => Promise<{
              data: ClientWrikeMapping[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    })
      .from('client_data_mappings')
      .select('client_id, external_account_id, external_account_name')
      .eq('provider', 'wrike')
      .eq('connector', 'project');
    if (error) {
      console.warn('Failed to load client wrike mappings:', error.message);
      return;
    }
    const next: Record<string, ClientWrikeMapping> = {};
    (data ?? []).forEach((row) => {
      next[row.client_id] = row;
    });
    setClientMappings(next);
  }, []);

  const loadWrikeFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    setFoldersError(null);
    try {
      const { data, error } = await supabase.functions.invoke('wrike-proxy', {
        body: { action: 'listFolders' },
      });
      if (error) throw error;
      const payload = data as { data?: WrikeFolder[]; error?: string };
      if (payload?.error) throw new Error(payload.error);
      const folders = (payload?.data ?? []).filter((f) => f?.id && f?.title);
      // Sort alphabetically by title for stable UI.
      folders.sort((a, b) =>
        a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }),
      );
      setWrikeFolders(folders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setFoldersError(message);
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadClientMappings();
  }, [loadStatus, loadClientMappings]);

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
  // In legacy env-var mode, `is_active` is false but Wrike still works.
  // We optimistically attempt to list folders — if it fails we surface the
  // error and hide the picker.
  const canAttemptWrikeCalls = isWrikeConnected || !isLoadingStatus;

  useEffect(() => {
    if (!canAttemptWrikeCalls) return;
    loadWrikeFolders();
  }, [canAttemptWrikeCalls, loadWrikeFolders]);

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
      ),
    [clients],
  );

  const handleMapClientToFolder = async (
    clientId: string,
    folderId: string,
  ) => {
    setSavingClientId(clientId);
    try {
      if (folderId === UNSET_FOLDER_VALUE) {
        // Clear the mapping.
        const { error } = await (
          supabase as unknown as {
            from: (t: string) => {
              delete: () => {
                eq: (col: string, val: string) => {
                  eq: (col: string, val: string) => {
                    eq: (
                      col: string,
                      val: string,
                    ) => Promise<{ error: { message: string } | null }>;
                  };
                };
              };
            };
          }
        )
          .from('client_data_mappings')
          .delete()
          .eq('client_id', clientId)
          .eq('provider', 'wrike')
          .eq('connector', 'project');
        if (error) throw new Error(error.message);
        setClientMappings((prev) => {
          const next = { ...prev };
          delete next[clientId];
          return next;
        });
        toast.success('Liaison Wrike supprimée');
        return;
      }

      const folder = wrikeFolders.find((f) => f.id === folderId);
      const { error } = await (
        supabase as unknown as {
          from: (t: string) => {
            upsert: (
              values: Record<string, unknown>,
              opts: { onConflict: string },
            ) => Promise<{ error: { message: string } | null }>;
          };
        }
      )
        .from('client_data_mappings')
        .upsert(
          {
            client_id: clientId,
            provider: 'wrike',
            connector: 'project',
            external_account_id: folderId,
            external_account_name: folder?.title ?? null,
            status: 'connected',
            is_active: true,
          },
          { onConflict: 'client_id,provider,connector' },
        );
      if (error) throw new Error(error.message);
      setClientMappings((prev) => ({
        ...prev,
        [clientId]: {
          client_id: clientId,
          external_account_id: folderId,
          external_account_name: folder?.title ?? null,
        },
      }));
      toast.success(`Client lié au dossier "${folder?.title ?? folderId}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Impossible d'enregistrer la liaison : ${message}`);
    } finally {
      setSavingClientId(null);
    }
  };

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
            ) : wrikeFolders.length > 0 ? (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Token permanent
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

      {/* Client ↔ Wrike folder mapping */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Liaison clients → dossiers Wrike</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Associez chaque client à son dossier Wrike pour activer la création automatique
                  de tâches quand une proposition est validée.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadWrikeFolders}
              disabled={isLoadingFolders}
            >
              {isLoadingFolders ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <FolderTree className="w-3 h-3 mr-1" />
              )}
              Rafraîchir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {foldersError && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
              Impossible de charger les dossiers Wrike : {foldersError}
            </div>
          )}
          {isLoadingFolders && wrikeFolders.length === 0 && !foldersError && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 p-3">
              <Loader2 className="w-3 h-3 animate-spin" />
              Chargement des dossiers Wrike…
            </div>
          )}
          {!isLoadingFolders && wrikeFolders.length === 0 && !foldersError && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
              Connectez d'abord Wrike (ci-dessus) pour charger la liste des dossiers.
            </div>
          )}
          {wrikeFolders.length > 0 && (
            <div className="space-y-2">
              {sortedClients.map((client) => {
                const mapping = clientMappings[client.id];
                const currentFolderId =
                  mapping?.external_account_id ?? UNSET_FOLDER_VALUE;
                const isSaving = savingClientId === client.id;
                const isLinked = Boolean(mapping?.external_account_id);
                return (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      {isLinked && (
                        <p className="text-xs text-muted-foreground truncate">
                          <Check className="w-3 h-3 inline mr-1 text-emerald-600" />
                          {mapping?.external_account_name ??
                            mapping?.external_account_id}
                        </p>
                      )}
                    </div>
                    <Select
                      value={currentFolderId}
                      onValueChange={(v) => handleMapClientToFolder(client.id, v)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-[280px] h-9">
                        <SelectValue placeholder="Sélectionner un dossier…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNSET_FOLDER_VALUE}>
                          <span className="text-muted-foreground">— Non lié —</span>
                        </SelectItem>
                        {wrikeFolders.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSaving && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

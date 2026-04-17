import { useState, useEffect } from 'react';
import { Settings, Building2, Pencil, Trash2, Plus, Loader2, Cog, UserCheck, Users, Database, Globe, Briefcase, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClientConfigDialog } from '@/components/admin/ClientConfigDialog';
import { ClientDataMappingsPanel } from '@/components/admin/ClientDataMappingsPanel';
import { FigmaBrandKitsPanel } from '@/components/admin/FigmaBrandKitsPanel';
import { IntegrationHealthPanel } from '@/components/admin/IntegrationHealthPanel';
import { RlsAuditPanel } from '@/components/admin/RlsAuditPanel';
import { TeamMembersPanel } from '@/components/admin/TeamMembersPanel';
import { ClientAccessDialog } from '@/components/admin/ClientAccessDialog';
import { useClient } from '@/contexts/ClientContext';

interface Client {
  id: string;
  name: string;
  color?: string;
}

interface ClientConfigRow {
  client_id: string;
  competitors: string[] | null;
  website_url: string | null;
  industry: string | null;
  market_news_keywords: string[] | null;
  linkedin_organization_id: string | null;
  hubspot_portal_id: string | null;
  google_analytics_property_id: string | null;
  ga4_property_id: string | null;
  google_ads_id: string | null;
  gsc_site_id: string | null;
  hubspot_analytics_id: string | null;
  meteoria_project_id: string | null;
  notion_page_id: string | null;
  onedrive_claude_path: string | null;
  semrush_campaign_id: string | null;
  semrush_project_id: string | null;
}

interface ClientProfileRow {
  client_id: string;
  presentation: string | null;
  ton: string | null;
  concurrents: unknown | null;
  audience_cible: unknown | null;
  piliers_contenu: unknown | null;
  messages_cles: unknown | null;
  problemes_clients: unknown | null;
  hashtags: unknown | null;
  types_posts: unknown | null;
  diagnostic_pmf: unknown | null;
  regles_specifiques: unknown | null;
  notes: string | null;
}

const colorOptions = [
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];

const INTEGRATION_LABELS: Record<string, string> = {
  linkedin_organization_id: 'LinkedIn',
  hubspot_portal_id: 'HubSpot',
  google_analytics_property_id: 'GA (legacy)',
  ga4_property_id: 'GA4',
  google_ads_id: 'Google Ads',
  gsc_site_id: 'Search Console',
  hubspot_analytics_id: 'HubSpot Analytics',
  meteoria_project_id: 'Meteoria',
  notion_page_id: 'Notion',
  onedrive_claude_path: 'OneDrive',
  semrush_campaign_id: 'SEMrush Campaign',
  semrush_project_id: 'SEMrush Project',
};

const INTEGRATION_KEYS = Object.keys(INTEGRATION_LABELS) as Array<keyof typeof INTEGRATION_LABELS>;

function countFilledIntegrations(cfg: ClientConfigRow | undefined): number {
  if (!cfg) return 0;
  return INTEGRATION_KEYS.filter((k) => {
    const v = cfg[k as keyof ClientConfigRow];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
}

function jsonArrayLength(val: unknown): number {
  if (Array.isArray(val)) return val.length;
  return 0;
}

function profileCompleteness(profile: ClientProfileRow | undefined): { filled: number; total: number } {
  if (!profile) return { filled: 0, total: 10 };
  const fields: Array<keyof ClientProfileRow> = [
    'presentation', 'ton', 'concurrents', 'audience_cible', 'piliers_contenu',
    'messages_cles', 'problemes_clients', 'hashtags', 'types_posts', 'diagnostic_pmf',
  ];
  let filled = 0;
  for (const f of fields) {
    const v = profile[f];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim().length > 0) { filled++; continue; }
    if (Array.isArray(v) && v.length > 0) { filled++; continue; }
    if (typeof v === 'object' && Object.keys(v as Record<string, unknown>).length > 0) { filled++; continue; }
  }
  return { filled, total: fields.length };
}

export default function Admin() {
  const { refetchClients, refetchConfig } = useClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [supportsColor, setSupportsColor] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientColor, setClientColor] = useState('blue');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configClient, setConfigClient] = useState<Client | null>(null);
  const [accessClient, setAccessClient] = useState<Client | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const [configsByClient, setConfigsByClient] = useState<Map<string, ClientConfigRow>>(new Map());
  const [profilesByClient, setProfilesByClient] = useState<Map<string, ClientProfileRow>>(new Map());

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const colorMissing = (message: string) => message.toLowerCase().includes('column clients.color does not exist');
    let { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');

    if (error && colorMissing(error.message)) {
      const fallback = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      data = fallback.data as Array<{ id: string; name: string; color?: string }> | null;
      error = fallback.error;
      setSupportsColor(false);
    } else {
      setSupportsColor(true);
    }

    if (error) {
      toast.error('Impossible de charger les clients');
      console.error('Error fetching clients:', error);
    } else {
      const normalized = ((data || []) as Array<{ id: string; name: string; color?: string }>).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? 'blue',
      }));
      setClients(normalized);
    }
    setIsLoading(false);
  };

  // Fetch all client_configs and client_profiles in bulk
  useEffect(() => {
    const fetchMeta = async () => {
      const [cfgRes, profRes] = await Promise.all([
        supabase.from('client_configs').select('*'),
        supabase.from('client_profiles').select('*'),
      ]);
      if (!cfgRes.error && cfgRes.data) {
        const map = new Map<string, ClientConfigRow>();
        (cfgRes.data as ClientConfigRow[]).forEach((r) => map.set(r.client_id, r));
        setConfigsByClient(map);
      }
      if (!profRes.error && profRes.data) {
        const map = new Map<string, ClientProfileRow>();
        (profRes.data as ClientProfileRow[]).forEach((r) => map.set(r.client_id, r));
        setProfilesByClient(map);
      }
    };
    fetchMeta();
  }, [clients]);

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingClient(null);
    setClientName('');
    setClientColor('blue');
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setIsCreating(false);
    setEditingClient(client);
    setClientName(client.name);
    setClientColor(client.color);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = clientName.trim();
    if (!trimmedName) {
      toast.error('Le nom du client est requis');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('Le nom doit faire moins de 100 caractères');
      return;
    }

    setIsSaving(true);

    if (isCreating) {
      const insertPayload = supportsColor
        ? { name: trimmedName, color: clientColor }
        : { name: trimmedName };
      const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('clients')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        toast.error('Impossible de créer le client');
        console.error('Error creating client:', error);
      } else if (data) {
        setClients([...clients, data as Client].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`Client "${trimmedName}" créé`);
        setIsDialogOpen(false);
        refetchClients();
      }
    } else if (editingClient) {
      const updatePayload = supportsColor
        ? { name: trimmedName, color: clientColor }
        : { name: trimmedName };
      const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', editingClient.id);

      if (error) {
        toast.error('Impossible de modifier le client');
        console.error('Error updating client:', error);
      } else {
        setClients(
          clients
            .map(c => c.id === editingClient.id ? { ...c, name: trimmedName } : c)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success(`Client "${trimmedName}" mis à jour`);
        setIsDialogOpen(false);
        refetchClients();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (client: Client) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (error) {
      toast.error('Impossible de supprimer le client');
      console.error('Error deleting client:', error);
    } else {
      setClients(clients.filter(c => c.id !== client.id));
      toast.success(`Client "${client.name}" supprimé`);
      refetchClients();
    }
  };

  const openConfigDialog = (client: Client) => {
    setConfigClient(client);
  };

  const getColorClass = (color: string) => {
    return colorOptions.find(c => c.value === color)?.class || 'bg-blue-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Gérez vos clients, votre équipe et les connexions de données.
        </p>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="w-4 h-4" />
            Équipe
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <Database className="w-4 h-4" />
            Données
          </TabsTrigger>
        </TabsList>

        {/* ── Clients Tab ── */}
        <TabsContent value="clients" className="space-y-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Clients</h2>
                <Badge variant="secondary">{clients.length}</Badge>
              </div>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucun client. Cliquez "Ajouter" pour en créer un.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {clients.map((client) => {
                  const cfg = configsByClient.get(client.id);
                  const prof = profilesByClient.get(client.id);
                  const intCount = countFilledIntegrations(cfg);
                  const { filled: profFilled, total: profTotal } = profileCompleteness(prof);
                  const isExpanded = expandedClientId === client.id;

                  return (
                    <div key={client.id} className="group">
                      {/* Summary row */}
                      <div className="p-3 flex items-center justify-between hover:bg-muted/50">
                        <button
                          type="button"
                          className="flex items-center gap-3 flex-1 text-left"
                          onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                        >
                          <div className={`w-8 h-8 rounded-lg ${getColorClass(client.color)} flex items-center justify-center shrink-0`}>
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium">{client.name}</span>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {cfg?.industry && (
                                <Badge variant="outline" className="text-[11px] h-5 gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {cfg.industry}
                                </Badge>
                              )}
                              {cfg?.website_url && (
                                <Badge variant="outline" className="text-[11px] h-5 gap-1">
                                  <Globe className="w-3 h-3" />
                                  {cfg.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </Badge>
                              )}
                              {(cfg?.competitors?.length ?? 0) > 0 && (
                                <Badge variant="secondary" className="text-[11px] h-5">
                                  {cfg!.competitors!.length} concurrent{cfg!.competitors!.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                              <Badge variant={intCount > 0 ? 'secondary' : 'outline'} className="text-[11px] h-5">
                                {intCount}/{INTEGRATION_KEYS.length} intégrations
                              </Badge>
                              <Badge variant={profFilled > 0 ? 'secondary' : 'outline'} className="text-[11px] h-5 gap-1">
                                <FileText className="w-3 h-3" />
                                Fiche {profFilled}/{profTotal}
                              </Badge>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAccessClient(client)} title="Gérer les accès">
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfigDialog(client)} title="Configurer">
                            <Cog className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(client)} title="Modifier">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(client)} title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-muted/30 border-t border-border space-y-4">
                          {/* Competitors */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Concurrents</h4>
                            {(cfg?.competitors?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {cfg!.competitors!.map((c) => (
                                  <Badge key={c} variant="secondary">{c}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Aucun concurrent configuré</p>
                            )}
                          </div>

                          {/* Market News Keywords */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mots-clés veille</h4>
                            {(cfg?.market_news_keywords?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {cfg!.market_news_keywords!.map((k) => (
                                  <Badge key={k} variant="outline">{k}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Aucun mot-clé configuré</p>
                            )}
                          </div>

                          {/* Integrations status */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Intégrations</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                              {INTEGRATION_KEYS.map((key) => {
                                const val = cfg?.[key as keyof ClientConfigRow];
                                const connected = typeof val === 'string' && val.trim().length > 0;
                                return (
                                  <div key={key} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${connected ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                                    {INTEGRATION_LABELS[key]}
                                    {connected && <span className="truncate max-w-[120px] opacity-60">({val as string})</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Client profile summary */}
                          {prof && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Fiche client</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {prof.presentation && (
                                  <div className="col-span-full">
                                    <span className="font-medium text-muted-foreground">Présentation : </span>
                                    <span className="text-foreground">{typeof prof.presentation === 'string' && prof.presentation.length > 200 ? prof.presentation.slice(0, 200) + '…' : prof.presentation}</span>
                                  </div>
                                )}
                                {prof.ton && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Ton : </span>
                                    <span>{prof.ton}</span>
                                  </div>
                                )}
                                {prof.concurrents && jsonArrayLength(prof.concurrents) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Concurrents (fiche) : </span>
                                    <span>{(prof.concurrents as string[]).join(', ')}</span>
                                  </div>
                                )}
                                {prof.audience_cible && jsonArrayLength(prof.audience_cible) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Audience cible : </span>
                                    <span>{Array.isArray(prof.audience_cible) ? (prof.audience_cible as string[]).join(', ') : JSON.stringify(prof.audience_cible)}</span>
                                  </div>
                                )}
                                {prof.piliers_contenu && jsonArrayLength(prof.piliers_contenu) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Piliers contenu : </span>
                                    <span>{Array.isArray(prof.piliers_contenu) ? (prof.piliers_contenu as string[]).join(', ') : JSON.stringify(prof.piliers_contenu)}</span>
                                  </div>
                                )}
                                {prof.messages_cles && jsonArrayLength(prof.messages_cles) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Messages clés : </span>
                                    <span>{Array.isArray(prof.messages_cles) ? (prof.messages_cles as string[]).join(', ') : JSON.stringify(prof.messages_cles)}</span>
                                  </div>
                                )}
                                {prof.problemes_clients && jsonArrayLength(prof.problemes_clients) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Problèmes clients : </span>
                                    <span>{Array.isArray(prof.problemes_clients) ? (prof.problemes_clients as string[]).join(', ') : JSON.stringify(prof.problemes_clients)}</span>
                                  </div>
                                )}
                                {prof.hashtags && jsonArrayLength(prof.hashtags) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Hashtags : </span>
                                    <span>{Array.isArray(prof.hashtags) ? (prof.hashtags as string[]).join(', ') : JSON.stringify(prof.hashtags)}</span>
                                  </div>
                                )}
                                {prof.types_posts && jsonArrayLength(prof.types_posts) > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Types de posts : </span>
                                    <span>{Array.isArray(prof.types_posts) ? (prof.types_posts as string[]).join(', ') : JSON.stringify(prof.types_posts)}</span>
                                  </div>
                                )}
                                {prof.notes && (
                                  <div className="col-span-full">
                                    <span className="font-medium text-muted-foreground">Notes : </span>
                                    <span>{prof.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {!prof && (
                            <p className="text-sm text-muted-foreground italic">Aucune fiche client renseignée</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Team Tab ── */}
        <TabsContent value="team">
          <TeamMembersPanel />
        </TabsContent>

        {/* ── Data Tab ── */}
        <TabsContent value="data" className="space-y-6">
          <ClientDataMappingsPanel clients={clients} />
          <IntegrationHealthPanel clients={clients} />
          <FigmaBrandKitsPanel clients={clients} />
          <RlsAuditPanel />
        </TabsContent>
      </Tabs>

      {/* Edit/Create Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Ajouter un client' : 'Modifier le client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nom du client</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Entrez le nom du client"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setClientColor(color.value)}
                    className={`w-8 h-8 rounded-lg ${color.class} transition-all ${
                      clientColor === color.value
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : 'hover:scale-110'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Config Dialog */}
      {configClient && (
        <ClientConfigDialog
          open={!!configClient}
          onOpenChange={(open) => !open && setConfigClient(null)}
          clientId={configClient.id}
          clientName={configClient.name}
          onSaved={refetchConfig}
        />
      )}

      {/* Client Access Dialog */}
      {accessClient && (
        <ClientAccessDialog
          open={!!accessClient}
          onOpenChange={(open) => !open && setAccessClient(null)}
          clientId={accessClient.id}
          clientName={accessClient.name}
        />
      )}
    </div>
  );
}

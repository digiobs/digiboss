import { useState, useEffect } from 'react';
import { Settings, Building2, Pencil, Trash2, Plus, Loader2, Cog, UserCheck, Users, Database, Palette } from 'lucide-react';
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
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                {clients.map((client) => (
                  <div key={client.id} className="p-3 flex items-center justify-between hover:bg-muted/50 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${getColorClass(client.color)} flex items-center justify-center`}>
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                ))}
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

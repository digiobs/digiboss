import { useState, useEffect } from 'react';
import { Settings, Users, CreditCard, Link, Shield, ChevronRight, Building2, Pencil, Trash2, Plus, Loader2, Cog, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';

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

const integrations = [
  { name: 'Google Analytics', status: 'connected', lastSync: '2 hours ago' },
  { name: 'HubSpot', status: 'connected', lastSync: '30 minutes ago' },
  { name: 'LinkedIn Ads', status: 'connected', lastSync: '1 hour ago' },
  { name: 'Google Ads', status: 'pending', lastSync: null },
  { name: 'SEMrush', status: 'disconnected', lastSync: null },
];


const auditLog = [
  { action: 'Campaign created', user: 'Alex Morgan', time: '2 hours ago' },
  { action: 'Lead status updated', user: 'Sarah Chen', time: '3 hours ago' },
  { action: 'Report exported', user: 'Mike Johnson', time: '5 hours ago' },
  { action: 'Integration connected', user: 'Alex Morgan', time: '1 day ago' },
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

  // Fetch clients from database
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
      toast.error('Failed to load clients');
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
      toast.error('Client name cannot be empty');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('Client name must be less than 100 characters');
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
        toast.error('Failed to create client');
        console.error('Error creating client:', error);
      } else if (data) {
        setClients([...clients, data as Client].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`Client "${trimmedName}" created`);
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
        toast.error('Failed to update client');
        console.error('Error updating client:', error);
      } else {
        setClients(
          clients
            .map(c => c.id === editingClient.id ? { ...c, name: trimmedName } : c)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success(`Client "${trimmedName}" updated`);
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
      toast.error('Failed to delete client');
      console.error('Error deleting client:', error);
    } else {
      setClients(clients.filter(c => c.id !== client.id));
      toast.success(`Client "${client.name}" deleted`);
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
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Workspace settings, users, billing, and integrations.
        </p>
      </div>
      <TabDataStatusBanner tab="admin" />

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold">Supabase linking plan</h2>
        <p className="text-sm text-muted-foreground">
          Use this checklist to complete data linkage for every tab.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Home</p>
            <p className="text-muted-foreground">Target table: <code>home_kpis</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Meetings</p>
            <p className="text-muted-foreground">Target table: <code>tldv_meetings</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Prospects</p>
            <p className="text-muted-foreground">Target table: <code>prospect_leads</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Plan</p>
            <p className="text-muted-foreground">Target table: <code>plan_tasks</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Content Creator</p>
            <p className="text-muted-foreground">Target table: <code>content_items</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Assets</p>
            <p className="text-muted-foreground">Target table: <code>asset_library</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Reporting</p>
            <p className="text-muted-foreground">Target table: <code>reporting_kpis</code></p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium">Chat</p>
            <p className="text-muted-foreground">Target table: <code>chat_messages</code></p>
          </div>
        </div>
      </div>

      <ClientDataMappingsPanel clients={clients} />
      <IntegrationHealthPanel clients={clients} />
      <RlsAuditPanel />
      <FigmaBrandKitsPanel clients={clients} />

      {/* Clients Management */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Clients</h2>
            <Badge variant="secondary">{clients.length}</Badge>
          </div>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-1" />
            Add Client
          </Button>
        </div>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No clients yet. Click "Add Client" to create one.
          </div>
        ) : (
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
          {clients.map((client) => (
            <div key={client.id} className="p-3 flex items-center justify-between hover:bg-muted/50 group">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${getColorClass(client.color)} flex items-center justify-center`}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{client.name}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAccessClient(client)} title="Manage access">
                  <UserCheck className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfigDialog(client)} title="Configure">
                  <Cog className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(client)} title="Edit">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(client)} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Roles */}
        <TeamMembersPanel />

        {/* Integrations */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Integrations</h2>
            </div>
            <Button size="sm" variant="outline">Browse All</Button>
          </div>
          <div className="divide-y divide-border">
            {integrations.map((integration) => (
              <div key={integration.name} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Link className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    {integration.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {integration.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    integration.status === 'connected'
                      ? 'status-completed'
                      : integration.status === 'pending'
                      ? 'status-in-progress'
                      : 'impact-low'
                  }
                >
                  {integration.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Billing</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Pro Plan</p>
                <p className="text-sm text-muted-foreground">$99/month • Billed monthly</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next billing date</span>
              <span className="text-sm font-medium">Feb 1, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usage this period</span>
              <span className="text-sm font-medium">2,340 / 5,000 AI credits</span>
            </div>
          </div>
        </div>

        {/* Security & Audit */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Audit Log</h2>
          </div>
          <div className="divide-y divide-border">
            {auditLog.map((log, index) => (
              <div key={index} className="p-3 flex items-center justify-between text-sm hover:bg-muted/50">
                <div>
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground"> by {log.user}</span>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full gap-2">
              View Full Log
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-4">Workspace Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Recommendations</p>
              <p className="text-sm text-muted-foreground">Enable AI-powered next best actions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive daily digest emails</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Slack Integration</p>
              <p className="text-sm text-muted-foreground">Post alerts to Slack channel</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Edit/Create Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add New Client' : 'Edit Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
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
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating ? 'Create' : 'Save Changes'}
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

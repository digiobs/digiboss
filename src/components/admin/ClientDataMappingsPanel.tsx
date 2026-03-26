import { useEffect, useMemo, useState } from "react";
import { Link2, Loader2, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useClient } from "@/contexts/ClientContext";

type ClientLite = {
  id: string;
  name: string;
};

type MappingStatus = "connected" | "pending" | "missing";
type MappingStrategy = "strict_id" | "alias_fallback" | "name_fallback" | "manual_override";

type ClientDataMapping = {
  id: string;
  client_id: string;
  provider: string;
  connector: string;
  external_account_id: string | null;
  external_account_name: string | null;
  status: MappingStatus;
  notes: string | null;
  external_workspace_id: string | null;
  external_project_id: string | null;
  mapping_strategy: MappingStrategy;
  alias_external_ids: string[] | null;
  priority: number;
  is_manual_override: boolean;
  is_active: boolean;
  updated_at: string;
};

const PROVIDERS = [
  "airtable",
  "supermetrics",
  "figma",
  "ga4",
  "hubspot",
  "linkedin",
  "google_ads",
  "gsc",
  "semrush",
  "tldv",
  "lemlist",
  "wrike",
];

const CONNECTORS = [
  "account",
  "project",
  "file",
  "brand_kit",
  "campaigns",
  "ads",
  "pages",
  "search_console",
  "meetings",
  "crm",
  "analytics",
];

const CORE_CONNECTORS: Array<{ provider: string; connector: string; label: string }> = [
  { provider: "supermetrics", connector: "account", label: "Supermetrics" },
  { provider: "ga4", connector: "analytics", label: "GA4" },
  { provider: "hubspot", connector: "crm", label: "HubSpot" },
  { provider: "linkedin", connector: "pages", label: "LinkedIn" },
  { provider: "semrush", connector: "account", label: "SEMrush" },
  { provider: "lemlist", connector: "campaigns", label: "Lemlist" },
  { provider: "tldv", connector: "meetings", label: "tl;dv" },
  { provider: "wrike", connector: "project", label: "Wrike" },
];

type ClientConfigLite = {
  client_id: string;
  linkedin_organization_id: string | null;
  hubspot_portal_id: string | null;
  google_analytics_property_id: string | null;
};

type FormState = {
  id: string | null;
  client_id: string;
  provider: string;
  connector: string;
  external_account_id: string;
  external_account_name: string;
  status: MappingStatus;
  notes: string;
  external_workspace_id: string;
  external_project_id: string;
  mapping_strategy: MappingStrategy;
  alias_external_ids: string;
  priority: number;
  is_manual_override: boolean;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  client_id: "",
  provider: "supermetrics",
  connector: "account",
  external_account_id: "",
  external_account_name: "",
  status: "missing",
  notes: "",
  external_workspace_id: "",
  external_project_id: "",
  mapping_strategy: "strict_id",
  alias_external_ids: "",
  priority: 100,
  is_manual_override: false,
  is_active: true,
};

export function ClientDataMappingsPanel({ clients }: { clients: ClientLite[] }) {
  const { currentClient, isAllClientsSelected } = useClient();
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<ClientDataMapping[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingLinkedin, setSyncingLinkedin] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const scopedClients = useMemo(() => {
    if (isAllClientsSelected) return clients;
    if (!currentClient?.id) return [];
    return clients.filter((client) => client.id === currentClient.id);
  }, [clients, currentClient?.id, isAllClientsSelected]);

  const fetchMappings = async () => {
    setLoading(true);
    let query = supabase
      .from("client_data_mappings")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!isAllClientsSelected && currentClient?.id) {
      query = query.eq("client_id", currentClient.id);
    }
    const { data, error } = await query;

    if (error) {
      const missingTable =
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("could not find the table");
      if (!missingTable) {
        toast.error("Failed to load data mappings");
        console.error("client_data_mappings query error:", error);
      }
      setMappings([]);
      setLoading(false);
      return;
    }

    setMappings((data ?? []) as ClientDataMapping[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMappings();
  }, [currentClient?.id, isAllClientsSelected]);

  const clientNameById = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c.name]));
  }, [clients]);

  const stats = useMemo(() => {
    return {
      total: mappings.length,
      connected: mappings.filter((m) => m.status === "connected").length,
      pending: mappings.filter((m) => m.status === "pending").length,
      missing: mappings.filter((m) => m.status === "missing").length,
    };
  }, [mappings]);

  const clientConnectorMatrix = useMemo(() => {
    return scopedClients.map((client) => {
      const byKey = new Map<string, ClientDataMapping>();
      mappings
        .filter((mapping) => mapping.client_id === client.id)
        .forEach((mapping) => byKey.set(`${mapping.provider}:${mapping.connector}`, mapping));

      const connectors = CORE_CONNECTORS.map((core) => {
        const key = `${core.provider}:${core.connector}`;
        const mapping = byKey.get(key);
        if (!mapping) {
          return {
            key,
            label: core.label,
            provider: core.provider,
            connector: core.connector,
            status: "missing" as MappingStatus,
            account: "NA",
            active: false,
          };
        }
        const account =
          mapping.external_account_id?.trim() ||
          mapping.external_account_name?.trim() ||
          "NA";
        return {
          key,
          label: core.label,
          provider: core.provider,
          connector: core.connector,
          status: mapping.status,
          account,
          active: mapping.is_active,
        };
      });

      const connected = connectors.filter((connector) => connector.status === "connected").length;
      const pending = connectors.filter((connector) => connector.status === "pending").length;
      const missing = connectors.filter((connector) => connector.status === "missing").length;

      return {
        client,
        connectors,
        connected,
        pending,
        missing,
      };
    });
  }, [scopedClients, mappings]);

  const knownEntriesByConnectorKey = useMemo(() => {
    const map = new Map<string, string[]>();
    CORE_CONNECTORS.forEach((core) => {
      const key = `${core.provider}:${core.connector}`;
      const values = new Set<string>();
      mappings
        .filter((mapping) => mapping.provider === core.provider && mapping.connector === core.connector)
        .forEach((mapping) => {
          const externalId = mapping.external_account_id?.trim();
          const externalName = mapping.external_account_name?.trim();
          if (externalId) values.add(externalId);
          if (externalName) values.add(externalName);
          if (Array.isArray(mapping.alias_external_ids)) {
            mapping.alias_external_ids
              .map((value) => value.trim())
              .filter(Boolean)
              .forEach((value) => values.add(value));
          }
        });
      map.set(key, Array.from(values).sort((a, b) => a.localeCompare(b)));
    });
    return map;
  }, [mappings]);

  const handleMatrixCellChange = async (
    clientId: string,
    provider: string,
    connector: string,
    selected: string,
  ) => {
    const selectedValue = selected === "__na__" ? "" : selected.trim();
    const existing = mappings.find(
      (mapping) =>
        mapping.client_id === clientId &&
        mapping.provider === provider &&
        mapping.connector === connector,
    );
    const payload = {
      client_id: clientId,
      provider,
      connector,
      external_account_id: selectedValue || null,
      external_account_name: selectedValue || existing?.external_account_name || null,
      status: selectedValue
        ? (existing?.status === "connected" ? "connected" : "pending")
        : ("missing" as MappingStatus),
      notes: existing?.notes ?? "Updated from matrix dropdown",
      external_workspace_id: existing?.external_workspace_id ?? null,
      external_project_id: existing?.external_project_id ?? null,
      mapping_strategy: existing?.mapping_strategy ?? "name_fallback",
      alias_external_ids: existing?.alias_external_ids ?? [],
      priority: existing?.priority ?? 100,
      is_manual_override: existing?.is_manual_override ?? false,
      is_active: selectedValue ? (existing?.is_active ?? false) : false,
      last_sync_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("client_data_mappings")
      .upsert(payload, { onConflict: "client_id,provider,connector" });
    if (error) {
      toast.error("Failed to update mapping from dropdown");
      console.error("matrix dropdown update error:", error);
      return;
    }
    await fetchMappings();
  };

  const knownAccountIdOptions = useMemo(() => {
    const ids = new Set<string>();
    mappings
      .filter((mapping) => mapping.provider === form.provider && mapping.connector === form.connector)
      .forEach((mapping) => {
        const externalId = mapping.external_account_id?.trim();
        if (externalId) ids.add(externalId);
        if (Array.isArray(mapping.alias_external_ids)) {
          mapping.alias_external_ids
            .map((value) => value.trim())
            .filter(Boolean)
            .forEach((value) => ids.add(value));
        }
      });
    return Array.from(ids).sort((a, b) => a.localeCompare(b));
  }, [mappings, form.provider, form.connector]);

  const knownAccountNameOptions = useMemo(() => {
    const names = new Set<string>();
    mappings
      .filter((mapping) => mapping.provider === form.provider && mapping.connector === form.connector)
      .forEach((mapping) => {
        const externalName = mapping.external_account_name?.trim();
        if (externalName) names.add(externalName);
      });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [mappings, form.provider, form.connector]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      client_id: scopedClients[0]?.id ?? clients[0]?.id ?? "",
    });
    setDialogOpen(true);
  };

  const openEdit = (mapping: ClientDataMapping) => {
    setForm({
      id: mapping.id,
      client_id: mapping.client_id,
      provider: mapping.provider,
      connector: mapping.connector,
      external_account_id: mapping.external_account_id ?? "",
      external_account_name: mapping.external_account_name ?? "",
      status: mapping.status,
      notes: mapping.notes ?? "",
      external_workspace_id: mapping.external_workspace_id ?? "",
      external_project_id: mapping.external_project_id ?? "",
      mapping_strategy: mapping.mapping_strategy ?? "strict_id",
      alias_external_ids: Array.isArray(mapping.alias_external_ids) ? mapping.alias_external_ids.join(", ") : "",
      priority: mapping.priority ?? 100,
      is_manual_override: Boolean(mapping.is_manual_override),
      is_active: mapping.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client_id || !form.provider || !form.connector) {
      toast.error("Client, provider and connector are required.");
      return;
    }

    const payload = {
      client_id: form.client_id,
      provider: form.provider,
      connector: form.connector,
      external_account_id: form.external_account_id || null,
      external_account_name: form.external_account_name || null,
      status: form.status,
      notes: form.notes || null,
      external_workspace_id: form.external_workspace_id || null,
      external_project_id: form.external_project_id || null,
      mapping_strategy: form.mapping_strategy,
      alias_external_ids: form.alias_external_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      priority: Number.isFinite(form.priority) ? form.priority : 100,
      is_manual_override: form.is_manual_override,
      is_active: form.is_active,
    };

    setSaving(true);
    if (form.id) {
      const { error } = await supabase.from("client_data_mappings").update(payload).eq("id", form.id);
      if (error) {
        toast.error("Failed to update mapping");
        console.error("update mapping error:", error);
      } else {
        toast.success("Mapping updated");
        setDialogOpen(false);
        fetchMappings();
      }
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("client_data_mappings").insert(payload);
    if (error) {
      toast.error("Failed to create mapping");
      console.error("insert mapping error:", error);
    } else {
      toast.success("Mapping created");
      setDialogOpen(false);
      fetchMappings();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("client_data_mappings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete mapping");
      console.error("delete mapping error:", error);
      return;
    }
    toast.success("Mapping deleted");
    fetchMappings();
  };

  const syncFromClientConfigs = async () => {
    setSyncing(true);
    const { data: configRows, error: configError } = await supabase
      .from("client_configs")
      .select("client_id,linkedin_organization_id,hubspot_portal_id,google_analytics_property_id");

    if (configError) {
      toast.error("Failed to sync from client configs");
      console.error("client_configs sync error:", configError);
      setSyncing(false);
      return;
    }

    const configByClient = new Map<string, ClientConfigLite>();
    (configRows ?? []).forEach((row) => {
      const record = row as unknown as ClientConfigLite;
      configByClient.set(record.client_id, record);
    });

    const payloads: Array<{
      client_id: string;
      provider: string;
      connector: string;
      external_account_id: string | null;
      external_account_name: string | null;
      status: MappingStatus;
      notes: string;
      last_sync_at: string;
    }> = [];

    const now = new Date().toISOString();
    for (const client of scopedClients) {
      const cfg = configByClient.get(client.id);

      const ga4Id = cfg?.google_analytics_property_id?.trim() || null;
      payloads.push({
        client_id: client.id,
        provider: "ga4",
        connector: "analytics",
        external_account_id: ga4Id,
        external_account_name: ga4Id ? `${client.name} GA4` : null,
        status: ga4Id ? "connected" : "missing",
        notes: "Synced from client_configs.google_analytics_property_id",
        last_sync_at: now,
      });

      const hubspotId = cfg?.hubspot_portal_id?.trim() || null;
      payloads.push({
        client_id: client.id,
        provider: "hubspot",
        connector: "crm",
        external_account_id: hubspotId,
        external_account_name: hubspotId ? `${client.name} HubSpot` : null,
        status: hubspotId ? "connected" : "missing",
        notes: "Synced from client_configs.hubspot_portal_id",
        last_sync_at: now,
      });

      const linkedinId = cfg?.linkedin_organization_id?.trim() || null;
      payloads.push({
        client_id: client.id,
        provider: "linkedin",
        connector: "pages",
        external_account_id: linkedinId,
        external_account_name: linkedinId ? `${client.name} LinkedIn` : null,
        status: linkedinId ? "connected" : "missing",
        notes: "Synced from client_configs.linkedin_organization_id",
        last_sync_at: now,
      });
    }

    const { error: upsertError } = await supabase
      .from("client_data_mappings")
      .upsert(payloads, { onConflict: "client_id,provider,connector" });

    if (upsertError) {
      toast.error("Failed to apply synced mappings");
      console.error("mapping upsert error:", upsertError);
      setSyncing(false);
      return;
    }

    toast.success("Mappings synced from client configs");
    await fetchMappings();
    setSyncing(false);
  };

  const runDataImport = async () => {
    setImporting(true);
    try {
      const now = new Date();
      const periodEnd = now.toISOString().slice(0, 10);
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      const periodStart = past.toISOString().slice(0, 10);

      const baseBody = !isAllClientsSelected && currentClient?.id ? { clientId: currentClient.id } : {};
      const runs = await Promise.all([
        supabase.functions.invoke("lemlist-sync", { body: { ...baseBody, limit: 50 } }),
        supabase.functions.invoke("semrush-sync", { body: { ...baseBody, limit: 20 } }),
        supabase.functions.invoke("supermetrics-sync", { body: { ...baseBody, periodStart, periodEnd } }),
      ]);

      const [lemlistRun, semrushRun, supermetricsRun] = runs;
      const errors = runs.filter((run) => Boolean(run.error));
      if (errors.length > 0) {
        errors.forEach((run) => {
          if (run.error) console.error("data import function error:", run.error);
        });
        toast.error("Data import completed with errors. Check integration health panel.");
      } else {
        toast.success(
          `Import done. Lemlist: ${lemlistRun.data?.synced ?? 0}, SEMrush: ${semrushRun.data?.synced ?? 0}, Supermetrics: ${supermetricsRun.data?.synced ?? 0}.`,
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const runLinkedinPostsSync = async () => {
    setSyncingLinkedin(true);
    try {
      const body = !isAllClientsSelected && currentClient?.id ? { clientId: currentClient.id } : {};
      const { data, error } = await supabase.functions.invoke("fetch-linkedin-posts", { body });
      if (error) {
        toast.error("LinkedIn posts sync failed");
        console.error("fetch-linkedin-posts invoke error:", error);
        return;
      }
      toast.success(`LinkedIn posts synced: ${data?.posts_upserted ?? 0} upserted.`);
    } finally {
      setSyncingLinkedin(false);
    }
  };

  const statusClass = (status: MappingStatus) => {
    if (status === "connected") return "status-completed";
    if (status === "pending") return "status-in-progress";
    return "impact-low";
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Data Mapping</h2>
          <Badge variant="secondary">{stats.total}</Badge>
          <Badge variant="outline">
            Scope: {isAllClientsSelected ? "All clients" : currentClient?.name ?? "No client"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "simple" ? "secondary" : "outline"}
            onClick={() => setViewMode("simple")}
          >
            Simple view
          </Button>
          <Button
            size="sm"
            variant={viewMode === "detailed" ? "secondary" : "outline"}
            onClick={() => setViewMode("detailed")}
          >
            Detailed view
          </Button>
          <Button size="sm" variant="outline" onClick={syncFromClientConfigs} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Sync now
          </Button>
          <Button size="sm" variant="outline" onClick={runDataImport} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Run data import
          </Button>
          <Button size="sm" variant="outline" onClick={runLinkedinPostsSync} disabled={syncingLinkedin}>
            {syncingLinkedin ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Sync LinkedIn posts
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Add Mapping
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border flex flex-wrap gap-2">
        <Badge variant="outline">Connected: {stats.connected}</Badge>
        <Badge variant="outline">Pending: {stats.pending}</Badge>
        <Badge variant="outline">Missing: {stats.missing}</Badge>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "simple" ? (
        <div className="p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            Rationalized connector coverage by client. Use Detailed view to edit a specific mapping.
          </div>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Client</th>
                  <th className="text-left px-3 py-2 font-medium">Coverage</th>
                  {CORE_CONNECTORS.map((core) => (
                    <th key={`${core.provider}:${core.connector}`} className="text-left px-3 py-2 font-medium">
                      {core.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientConnectorMatrix.map((row) => (
                  <tr key={row.client.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{row.client.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">ok {row.connected}</Badge>
                        <Badge variant="outline">pending {row.pending}</Badge>
                        <Badge variant="outline">missing {row.missing}</Badge>
                      </div>
                    </td>
                    {row.connectors.map((connector) => (
                      <td key={connector.key} className="px-3 py-2 min-w-[150px]">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className={statusClass(connector.status)}>
                            {connector.status}
                          </Badge>
                          <Select
                            value={connector.account === "NA" ? "__na__" : connector.account}
                            onValueChange={(value) =>
                              handleMatrixCellChange(
                                row.client.id,
                                connector.provider,
                                connector.connector,
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__na__">NA</SelectItem>
                              {Array.from(
                                new Set([
                                  ...((knownEntriesByConnectorKey.get(connector.key) ?? [])),
                                  ...(connector.account !== "NA" ? [connector.account] : []),
                                ]),
                              ).map((entry) => (
                                <SelectItem key={`${connector.key}-${entry}`} value={entry}>
                                  {entry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {!connector.active ? "inactive" : "active"}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : mappings.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No mappings yet. Add client/source mappings to enable real imports.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {mappings.map((mapping) => (
            <div key={mapping.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{clientNameById.get(mapping.client_id) ?? mapping.client_id}</span>
                  <Badge variant="secondary">{mapping.provider}</Badge>
                  <Badge variant="outline">{mapping.connector}</Badge>
                  <Badge variant="secondary" className={statusClass(mapping.status)}>
                    {mapping.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {mapping.external_account_name ?? "NA"} ({mapping.external_account_id ?? "NA"})
                </p>
                {mapping.notes && <p className="text-xs text-muted-foreground">{mapping.notes}</p>}
                <p className="text-xs text-muted-foreground">
                  Strategy: {mapping.mapping_strategy} · Priority: {mapping.priority} ·{" "}
                  {mapping.is_active ? "active" : "inactive"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(mapping)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(mapping.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit data mapping" : "Add data mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={(value) => setForm((f) => ({ ...f, client_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {scopedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(value) => setForm((f) => ({ ...f, provider: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connector</Label>
                <Select value={form.connector} onValueChange={(value) => setForm((f) => ({ ...f, connector: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTORS.map((connector) => (
                      <SelectItem key={connector} value={connector}>
                        {connector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>External Account ID</Label>
              <Input
                value={form.external_account_id}
                onChange={(e) => setForm((f) => ({ ...f, external_account_id: e.target.value }))}
                placeholder="ex: 123456789"
              />
              {knownAccountIdOptions.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Known entries</Label>
                  <Select
                    value="__custom__"
                    onValueChange={(value) => {
                      if (value === "__custom__") return;
                      setForm((f) => ({ ...f, external_account_id: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a known account ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__custom__">Custom value</SelectItem>
                      {knownAccountIdOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>External Account Name</Label>
              <Input
                value={form.external_account_name}
                onChange={(e) => setForm((f) => ({ ...f, external_account_name: e.target.value }))}
                placeholder="ex: DigiObs - LinkedIn Ads"
              />
              {knownAccountNameOptions.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Known entries</Label>
                  <Select
                    value="__custom__"
                    onValueChange={(value) => {
                      if (value === "__custom__") return;
                      setForm((f) => ({ ...f, external_account_name: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a known account name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__custom__">Custom value</SelectItem>
                      {knownAccountNameOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((f) => ({ ...f, status: value as MappingStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">connected</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="missing">missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mapping strategy</Label>
              <Select
                value={form.mapping_strategy}
                onValueChange={(value) => setForm((f) => ({ ...f, mapping_strategy: value as MappingStrategy }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict_id">strict_id</SelectItem>
                  <SelectItem value="alias_fallback">alias_fallback</SelectItem>
                  <SelectItem value="name_fallback">name_fallback</SelectItem>
                  <SelectItem value="manual_override">manual_override</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Workspace ID</Label>
                <Input
                  value={form.external_workspace_id}
                  onChange={(e) => setForm((f) => ({ ...f, external_workspace_id: e.target.value }))}
                  placeholder="Optional workspace id"
                />
              </div>
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input
                  value={form.external_project_id}
                  onChange={(e) => setForm((f) => ({ ...f, external_project_id: e.target.value }))}
                  placeholder="Optional project id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aliases (comma separated external IDs)</Label>
              <Input
                value={form.alias_external_ids}
                onChange={(e) => setForm((f) => ({ ...f, alias_external_ids: e.target.value }))}
                placeholder="id_1, id_2, id_3"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={String(form.priority)}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 100 }))}
                  min={1}
                  max={1000}
                />
              </div>
              <div className="space-y-2">
                <Label>Manual override</Label>
                <Select
                  value={form.is_manual_override ? "yes" : "no"}
                  onValueChange={(value) => setForm((f) => ({ ...f, is_manual_override: value === "yes" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">yes</SelectItem>
                    <SelectItem value="no">no</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <Select
                  value={form.is_active ? "yes" : "no"}
                  onValueChange={(value) => setForm((f) => ({ ...f, is_active: value === "yes" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">yes</SelectItem>
                    <SelectItem value="no">no</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional setup notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


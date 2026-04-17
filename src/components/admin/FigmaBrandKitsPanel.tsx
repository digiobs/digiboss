import { useEffect, useMemo, useState } from "react";
import { Loader2, Palette, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type ClientLite = {
  id: string;
  name: string;
};

type BrandKitRow = {
  id: string;
  client_id: string;
  figma_file_key: string;
  token_type: string;
  token_name: string;
  token_value: string | null;
  imported_at: string;
};

export function FigmaBrandKitsPanel({ clients }: { clients: ClientLite[] }) {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [rows, setRows] = useState<BrandKitRow[]>([]);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
      .from("client_brand_kits")
      .select("id,client_id,figma_file_key,token_type,token_name,token_value,imported_at")
      .order("imported_at", { ascending: false })
      .limit(300);

    if (error) {
      const missingTable =
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("could not find the table");
      if (!missingTable) {
        toast.error("Failed to load Figma brand kits");
        console.error("client_brand_kits query error:", error);
      }
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(((data ?? []) as unknown) as BrandKitRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const clientNameById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client.name]));
  }, [clients]);

  const filteredRows = useMemo(() => {
    if (selectedClientId === "all") return rows;
    return rows.filter((row) => row.client_id === selectedClientId);
  }, [rows, selectedClientId]);

  const runImport = async () => {
    setImporting(true);
    const payload = selectedClientId === "all" ? {} : { clientId: selectedClientId };
    const { data, error } = await supabase.functions.invoke("figma-brand-kit-import", {
      body: payload,
    });

    if (error) {
      toast.error("Figma import failed");
      console.error("figma-brand-kit-import error:", error);
      setImporting(false);
      return;
    }

    toast.success(
      `Imported ${data?.importedTokens ?? 0} tokens for ${data?.importedClients ?? 0} client(s).`,
    );
    await fetchRows();
    setImporting(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Figma Brand Kits</h2>
          <Badge variant="secondary">{filteredRows.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={fetchRows} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={runImport} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Import from Figma
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No brand kit tokens yet. Add a connected <code>figma</code> mapping in Data Mapping, then run import.
        </div>
      ) : (
        <div className="max-h-[380px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{clientNameById.get(row.client_id) ?? row.client_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.token_type}</Badge>
                  </TableCell>
                  <TableCell>{row.token_name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.figma_file_key}</TableCell>
                  <TableCell className="font-mono text-xs">{row.token_value ?? "NA"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

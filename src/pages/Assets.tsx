import { FolderOpen, Search, Grid3X3, List, Plus, FileText, Image, Palette, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { assets } from '@/data/mockData';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useSupabaseAssets } from '@/hooks/useSupabaseTabData';
import { useEffect, useMemo, useState } from 'react';
import { ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';

// Import asset illustrations
import assetLogo from '@/assets/illustrations/asset-logo.jpg';
import assetDeck from '@/assets/illustrations/asset-deck.jpg';
import assetGuideline from '@/assets/illustrations/asset-guideline.jpg';
import assetTemplate from '@/assets/illustrations/asset-template.jpg';
import assetImage from '@/assets/illustrations/asset-image.jpg';

const typeIcons = {
  logo: Image,
  deck: FileText,
  guideline: Palette,
  template: Layout,
  image: Image,
};

const typeIllustrations: Record<string, string> = {
  logo: assetLogo,
  deck: assetDeck,
  guideline: assetGuideline,
  template: assetTemplate,
  image: assetImage,
};

export default function Assets() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: resolvedAssets } = useSupabaseAssets(assets);
  const { currentClient, isAllClientsSelected } = useClient();
  const [brandKitRows, setBrandKitRows] = useState<
    Array<{
      id: string;
      token_type: string;
      token_name: string;
      token_value: string | null;
      imported_at: string;
    }>
  >([]);
  const [figmaFolders, setFigmaFolders] = useState<
    Array<{
      id: string;
      client_id: string;
      file_key: string;
      file_name: string;
      folder_id: string;
      folder_name: string;
      folder_type: string;
      thumbnail_url: string | null;
    }>
  >([]);
  const [figmaSyncStates, setFigmaSyncStates] = useState<
    Array<{
      client_id: string;
      status: string;
      folder_count: number;
      file_count: number;
      last_synced_at: string | null;
      message: string | null;
    }>
  >([]);
  const [refreshingFigma, setRefreshingFigma] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) setBrandKitRows([]);
        return;
      }

      let query = supabase
        .from('client_brand_kits')
        .select('id,token_type,token_name,token_value,imported_at')
        .order('imported_at', { ascending: false })
        .limit(500);
      if (!isAllClientsSelected) {
        query = query.eq('client_id', currentClient.id);
      }
      const { data, error } = await query;

      if (error) {
        console.error('client_brand_kits query error:', error);
        if (mounted) setBrandKitRows([]);
        return;
      }

      if (mounted) {
        setBrandKitRows(
          ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
            id: String(row.id ?? ''),
            token_type: typeof row.token_type === 'string' ? row.token_type : 'unknown',
            token_name: typeof row.token_name === 'string' ? row.token_name : 'Untitled token',
            token_value: typeof row.token_value === 'string' ? row.token_value : null,
            imported_at: typeof row.imported_at === 'string' ? row.imported_at : new Date().toISOString(),
          })),
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, isAllClientsSelected]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) setFigmaFolders([]);
        return;
      }

      const body = isAllClientsSelected ? {} : { clientId: currentClient.id };
      const { data, error } = await supabase.functions.invoke('figma-projects', { body });

      if (error) {
        console.error('figma-projects invoke error:', error);
        if (mounted) setFigmaFolders([]);
        return;
      }

      const rows = Array.isArray(data?.folders) ? (data.folders as Array<Record<string, unknown>>) : [];
      const syncRows = Array.isArray(data?.syncStates) ? (data.syncStates as Array<Record<string, unknown>>) : [];
      if (mounted) {
        setFigmaFolders(
          rows.map((row) => ({
            id: String(row.id ?? `${String(row.client_id ?? '')}:${String(row.file_key ?? '')}:${String(row.folder_id ?? '')}`),
            client_id: String(row.client_id ?? ''),
            file_key: String(row.file_key ?? ''),
            file_name: String(row.file_name ?? 'Untitled file'),
            folder_id: String(row.folder_id ?? ''),
            folder_name: String(row.folder_name ?? 'Untitled folder'),
            folder_type: String(row.folder_type ?? 'PAGE'),
            thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
          })),
        );
        setFigmaSyncStates(
          syncRows.map((row) => ({
            client_id: String(row.client_id ?? ''),
            status: String(row.status ?? 'pending'),
            folder_count: typeof row.folder_count === 'number' ? row.folder_count : 0,
            file_count: typeof row.file_count === 'number' ? row.file_count : 0,
            last_synced_at: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
            message: typeof row.message === 'string' ? row.message : null,
          })),
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, isAllClientsSelected]);

  const refreshFigmaCache = async () => {
    if (!currentClient?.id) return;
    setRefreshingFigma(true);
    const body = isAllClientsSelected ? { refresh: true } : { clientId: currentClient.id, refresh: true };
    const { data, error } = await supabase.functions.invoke('figma-projects', { body });
    if (error) {
      console.error('figma-projects refresh error:', error);
      setRefreshingFigma(false);
      return;
    }
    const rows = Array.isArray(data?.folders) ? (data.folders as Array<Record<string, unknown>>) : [];
    const syncRows = Array.isArray(data?.syncStates) ? (data.syncStates as Array<Record<string, unknown>>) : [];
    setFigmaFolders(
      rows.map((row) => ({
        id: String(row.id ?? `${String(row.client_id ?? '')}:${String(row.file_key ?? '')}:${String(row.folder_id ?? '')}`),
        client_id: String(row.client_id ?? ''),
        file_key: String(row.file_key ?? ''),
        file_name: String(row.file_name ?? 'Untitled file'),
        folder_id: String(row.folder_id ?? ''),
        folder_name: String(row.folder_name ?? 'Untitled folder'),
        folder_type: String(row.folder_type ?? 'PAGE'),
        thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
      })),
    );
    setFigmaSyncStates(
      syncRows.map((row) => ({
        client_id: String(row.client_id ?? ''),
        status: String(row.status ?? 'pending'),
        folder_count: typeof row.folder_count === 'number' ? row.folder_count : 0,
        file_count: typeof row.file_count === 'number' ? row.file_count : 0,
        last_synced_at: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
        message: typeof row.message === 'string' ? row.message : null,
      })),
    );
    setRefreshingFigma(false);
  };

  const brandKit = useMemo(() => {
    const colors = new Map<string, { name: string; value: string }>();
    const typography = new Map<string, string>();
    let latestImport: string | null = null;

    for (const row of brandKitRows) {
      if (!latestImport || row.imported_at > latestImport) {
        latestImport = row.imported_at;
      }

      if (row.token_type === 'color' && row.token_value && row.token_value.startsWith('#')) {
        if (!colors.has(row.token_value)) {
          colors.set(row.token_value, {
            name: row.token_name,
            value: row.token_value,
          });
        }
      }

      if (row.token_type === 'text' && row.token_value) {
        const familyMatch = row.token_value.match(/family=([^;]+)/i);
        const family = familyMatch?.[1]?.trim() || row.token_name;
        if (!typography.has(family)) {
          typography.set(family, row.token_value);
        }
      }
    }

    return {
      colors: Array.from(colors.values()).slice(0, 8),
      typography: Array.from(typography.entries()).slice(0, 6),
      totalTokens: brandKitRows.length,
      latestImport,
    };
  }, [brandKitRows]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Your brand library: logos, decks, guidelines, and templates.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Upload Asset
        </Button>
      </div>
      <TabDataStatusBanner tab="assets" />

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Find the right asset for..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">All</Button>
        <Button variant="outline" size="sm">Logos</Button>
        <Button variant="outline" size="sm">Decks</Button>
        <Button variant="outline" size="sm">Guidelines</Button>
        <Button variant="outline" size="sm">Templates</Button>
      </div>

      {/* Assets Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {resolvedAssets.map((asset) => {
            const Icon = typeIcons[asset.type];
            return (
              <div
                key={asset.id}
                className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  <img 
                    src={typeIllustrations[asset.type]} 
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{asset.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {asset.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{asset.version}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assets List */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                  Version
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                  Tags
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {resolvedAssets.map((asset) => {
                const Icon = typeIcons[asset.type];
                return (
                  <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                          <img 
                            src={typeIllustrations[asset.type]} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-sm">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">{asset.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">v{asset.version}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {asset.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand Kit Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Brand Kit</h2>
          <Badge variant="outline" className="ml-2">
            {currentClient?.id === ALL_CLIENTS_ID ? 'All clients' : currentClient?.name ?? 'NA'}
          </Badge>
          <Badge variant="secondary">{brandKit.totalTokens} tokens</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Brand Colors</h3>
            {brandKit.colors.length === 0 ? (
              <p className="text-sm text-muted-foreground">NA</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {brandKit.colors.map((color) => (
                  <div key={color.value} className="text-center">
                    <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: color.value }} />
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[72px] truncate">{color.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Typography</h3>
            {brandKit.typography.length === 0 ? (
              <p className="text-sm text-muted-foreground">NA</p>
            ) : (
              <div className="space-y-2">
                {brandKit.typography.map(([family, details]) => (
                  <div key={family} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{family}</span>
                    <p className="text-xs truncate">{details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Brand Kit Metadata</h3>
            <p className="text-sm text-muted-foreground">
              Last import: {brandKit.latestImport ? new Date(brandKit.latestImport).toLocaleString() : 'NA'}
              <br />
              Color tokens: {brandKitRows.filter((row) => row.token_type === 'color').length || 'NA'}
              <br />
              Text tokens: {brandKitRows.filter((row) => row.token_type === 'text').length || 'NA'}
            </p>
          </div>
        </div>
      </div>

      {/* Figma Projects Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Figma Projects</h2>
          <Badge variant="secondary">{figmaFolders.length} folders</Badge>
          <Button size="sm" variant="outline" className="ml-auto" onClick={refreshFigmaCache} disabled={refreshingFigma}>
            {refreshingFigma ? 'Refreshing...' : 'Refresh cache'}
          </Button>
        </div>
        {figmaSyncStates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {figmaSyncStates.map((state) => (
              <div key={state.client_id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium truncate">{state.client_id}</p>
                <p className="text-xs text-muted-foreground">
                  {state.status} - {state.folder_count} folders / {state.file_count} files
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {state.last_synced_at ? new Date(state.last_synced_at).toLocaleString() : 'NA'}
                </p>
              </div>
            ))}
          </div>
        )}
        {figmaFolders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            NA - Connect Figma mappings to display project folders and thumbnails.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {figmaFolders.map((folder) => (
              <div
                key={folder.id}
                className="rounded-lg border border-border overflow-hidden bg-card hover:border-primary/30 transition-colors"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={folder.thumbnail_url ?? assetImage}
                    alt={folder.folder_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate">{folder.folder_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{folder.file_name}</p>
                  <Badge variant="outline" className="text-[10px]">{folder.folder_type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

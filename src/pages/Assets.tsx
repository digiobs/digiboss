import { FolderOpen, Search, Grid3X3, List, Plus, FileText, Image, Palette, ExternalLink, CloudIcon, RefreshCw, Type, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { assets } from '@/data/mockData';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useSupabaseAssets } from '@/hooks/useSupabaseTabData';
import { useDeliverables } from '@/hooks/useDeliverables';
import { useEffect, useMemo, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import asset illustrations
import assetLogo from '@/assets/illustrations/asset-logo.jpg';
import assetDeck from '@/assets/illustrations/asset-deck.jpg';
import assetGuideline from '@/assets/illustrations/asset-guideline.jpg';
import assetTemplate from '@/assets/illustrations/asset-template.jpg';
import assetImage from '@/assets/illustrations/asset-image.jpg';

const typeIllustrations: Record<string, string> = {
  logo: assetLogo,
  deck: assetDeck,
  guideline: assetGuideline,
  template: assetTemplate,
  image: assetImage,
};

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type BrandColor = { hex: string; name: string; usage?: string };
type FigmaUrl = { url: string; name: string };
type StyleVisuel = Record<string, string>;

type BrandGuidelines = {
  colors: BrandColor[];
  typographies: string[];
  figma_urls: FigmaUrl[];
  style_visuel: StyleVisuel | null;
};

type FigmaFolder = {
  id: string;
  client_id: string;
  file_key: string;
  file_name: string;
  folder_id: string;
  folder_name: string;
  folder_type: string;
  thumbnail_url: string | null;
};

type FigmaSyncState = {
  client_id: string;
  status: string;
  folder_count: number;
  file_count: number;
  last_synced_at: string | null;
  message: string | null;
};

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  'seo-strategy': 'SEO Strategy',
  'audit-seo': 'Audit SEO',
  'rapport-performance': 'Performance Report',
  'analyse-pmf': 'PMF Analysis',
  'content-article': 'Article',
  'content-post': 'Social Post',
  'campagne': 'Campaign',
  'architecture-site': 'Site Architecture',
  'orchestrateur': 'Orchestrator',
  'veille': 'Market Watch',
  'autre': 'Other',
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function Assets() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: resolvedAssets } = useSupabaseAssets(assets);
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const [syncingAssets, setSyncingAssets] = useState(false);

  const syncAllAssets = async () => {
    setSyncingAssets(true);
    try {
      const payload = isAllClientsSelected ? { refresh: true } : { clientId: currentClient?.id, refresh: true };
      const { error } = await supabase.functions.invoke('figma-projects', { body: payload });
      if (error) throw error;
      toast.success('Assets synced');
      window.location.reload();
    } catch (err) {
      console.error('assets sync failed:', err);
      toast.error('Assets sync failed');
    } finally {
      setSyncingAssets(false);
    }
  };

  // Brand guidelines from client fiches
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines | null>(null);

  // Figma folders from DB cache (not edge function)
  const [figmaFolders, setFigmaFolders] = useState<FigmaFolder[]>([]);
  const [figmaSyncStates, setFigmaSyncStates] = useState<FigmaSyncState[]>([]);
  const [refreshingFigma, setRefreshingFigma] = useState(false);

  // OneDrive path
  const [onedrivePath, setOnedrivePath] = useState<string | null>(null);

  // Deliverables
  const { data: deliverables, isLoading: deliverablesLoading } = useDeliverables();

  /* ---------- Fetch brand guidelines from client_brand_guidelines ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id || isAllClientsSelected) {
        if (mounted) setBrandGuidelines(null);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('client_brand_guidelines')
        .select('colors,typographies,figma_urls,style_visuel')
        .eq('client_id', currentClient.id)
        .maybeSingle();

      if (error) {
        console.error('client_brand_guidelines query error:', error);
        if (mounted) setBrandGuidelines(null);
        return;
      }

      if (!data) {
        if (mounted) setBrandGuidelines(null);
        return;
      }

      if (mounted) {
        setBrandGuidelines({
          colors: Array.isArray(data.colors) ? (data.colors as BrandColor[]) : [],
          typographies: Array.isArray(data.typographies) ? (data.typographies as string[]) : [],
          figma_urls: Array.isArray(data.figma_urls) ? (data.figma_urls as FigmaUrl[]) : [],
          style_visuel: data.style_visuel && typeof data.style_visuel === 'object' && !Array.isArray(data.style_visuel)
            ? (data.style_visuel as StyleVisuel)
            : null,
        });
      }
    })();
    return () => { mounted = false; };
  }, [currentClient?.id, isAllClientsSelected]);

  /* ---------- Fetch OneDrive path from client_configs ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id || isAllClientsSelected) {
        if (mounted) setOnedrivePath(null);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('client_configs')
        .select('onedrive_claude_path')
        .eq('client_id', currentClient.id)
        .maybeSingle();

      if (mounted) {
        setOnedrivePath(
          !error && data && typeof data.onedrive_claude_path === 'string'
            ? data.onedrive_claude_path
            : null,
        );
      }
    })();
    return () => { mounted = false; };
  }, [currentClient?.id, isAllClientsSelected]);

  /* ---------- Fetch Figma folders from DB cache ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) { setFigmaFolders([]); setFigmaSyncStates([]); }
        return;
      }

      // Fetch folders from cache table
      let folderQuery = (supabase as any)
        .from('client_figma_folders')
        .select('id,client_id,file_key,file_name,folder_id,folder_name,folder_type,thumbnail_url')
        .order('page_index', { ascending: true })
        .limit(200);
      if (!isAllClientsSelected) {
        folderQuery = folderQuery.eq('client_id', currentClient.id);
      }

      let syncQuery = (supabase as any)
        .from('client_figma_sync_state')
        .select('client_id,status,folder_count,file_count,last_synced_at,message');
      if (!isAllClientsSelected) {
        syncQuery = syncQuery.eq('client_id', currentClient.id);
      }

      const [foldersRes, syncRes] = await Promise.all([folderQuery, syncQuery]);

      if (mounted) {
        setFigmaFolders(
          (foldersRes.data ?? []).map((row) => ({
            id: String(row.id),
            client_id: String(row.client_id),
            file_key: String(row.file_key),
            file_name: String(row.file_name ?? 'Untitled file'),
            folder_id: String(row.folder_id),
            folder_name: String(row.folder_name ?? 'Untitled folder'),
            folder_type: String(row.folder_type ?? 'PAGE'),
            thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
          })),
        );
        setFigmaSyncStates(
          (syncRes.data ?? []).map((row) => ({
            client_id: String(row.client_id),
            status: String(row.status ?? 'pending'),
            folder_count: typeof row.folder_count === 'number' ? row.folder_count : 0,
            file_count: typeof row.file_count === 'number' ? row.file_count : 0,
            last_synced_at: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
            message: typeof row.message === 'string' ? row.message : null,
          })),
        );
      }
    })();
    return () => { mounted = false; };
  }, [currentClient?.id, isAllClientsSelected]);

  /* ---------- Refresh Figma cache via edge function ---------- */
  const refreshFigmaCache = async () => {
    if (!currentClient?.id) return;
    setRefreshingFigma(true);
    try {
      const body = isAllClientsSelected ? { refresh: true } : { clientId: currentClient.id, refresh: true };
      const { error } = await supabase.functions.invoke('figma-projects', { body });
      if (error) {
        console.error('figma-projects refresh error:', error);
        setRefreshingFigma(false);
        return;
      }
      // Re-read from DB after refresh
      let folderQuery = (supabase as any)
        .from('client_figma_folders')
        .select('id,client_id,file_key,file_name,folder_id,folder_name,folder_type,thumbnail_url')
        .order('page_index', { ascending: true })
        .limit(200);
      if (!isAllClientsSelected) {
        folderQuery = folderQuery.eq('client_id', currentClient.id);
      }
      let syncQuery = (supabase as any)
        .from('client_figma_sync_state')
        .select('client_id,status,folder_count,file_count,last_synced_at,message');
      if (!isAllClientsSelected) {
        syncQuery = syncQuery.eq('client_id', currentClient.id);
      }
      const [foldersRes, syncRes] = await Promise.all([folderQuery, syncQuery]);
      setFigmaFolders(
        (foldersRes.data ?? []).map((row) => ({
          id: String(row.id),
          client_id: String(row.client_id),
          file_key: String(row.file_key),
          file_name: String(row.file_name ?? 'Untitled file'),
          folder_id: String(row.folder_id),
          folder_name: String(row.folder_name ?? 'Untitled folder'),
          folder_type: String(row.folder_type ?? 'PAGE'),
          thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
        })),
      );
      setFigmaSyncStates(
        (syncRes.data ?? []).map((row) => ({
          client_id: String(row.client_id),
          status: String(row.status ?? 'pending'),
          folder_count: typeof row.folder_count === 'number' ? row.folder_count : 0,
          file_count: typeof row.file_count === 'number' ? row.file_count : 0,
          last_synced_at: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
          message: typeof row.message === 'string' ? row.message : null,
        })),
      );
    } catch (err) {
      console.error('figma-projects refresh error:', err);
    }
    setRefreshingFigma(false);
  };

  /* ---------- Group Figma folders by file ---------- */
  const figmaFileGroups = useMemo(() => {
    const groups = new Map<string, { file_name: string; file_key: string; folders: FigmaFolder[] }>();
    for (const folder of figmaFolders) {
      const key = `${folder.client_id}:${folder.file_key}`;
      if (!groups.has(key)) {
        groups.set(key, { file_name: folder.file_name, file_key: folder.file_key, folders: [] });
      }
      groups.get(key)!.folders.push(folder);
    }
    return Array.from(groups.values());
  }, [figmaFolders]);

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
            Brand kit, Figma projects, and deliverables for{' '}
            {isAllClientsSelected ? 'all clients' : currentClient?.name ?? 'selected client'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={syncAllAssets} disabled={syncingAssets}>
              <RefreshCw className={`w-4 h-4 ${syncingAssets ? 'animate-spin' : ''}`} />
              {syncingAssets ? 'Syncing...' : 'Sync Assets'}
            </Button>
          )}
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Asset
          </Button>
        </div>
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

      {/* ============================================================ */}
      {/*  BRAND KIT (from client_brand_guidelines)                    */}
      {/* ============================================================ */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Brand Kit</h2>
          <Badge variant="outline" className="ml-2">
            {isAllClientsSelected ? 'Admin (all clients)' : currentClient?.name ?? 'NA'}
          </Badge>
        </div>

        {isAllClientsSelected ? (
          <p className="text-sm text-muted-foreground">
            Select a client to view their brand kit.
          </p>
        ) : !brandGuidelines ? (
          <p className="text-sm text-muted-foreground">
            No brand guidelines configured for this client.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Colors */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Colors
              </h3>
              {brandGuidelines.colors.length === 0 ? (
                <p className="text-sm text-muted-foreground">NA</p>
              ) : (
                <div className="flex items-start gap-3 flex-wrap">
                  {brandGuidelines.colors.map((color) => (
                    <div key={color.hex} className="text-center group">
                      <div
                        className="w-12 h-12 rounded-lg border border-border shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} — ${color.usage ?? ''}`}
                      />
                      <p className="text-[10px] font-medium mt-1 text-foreground truncate max-w-[56px]">
                        {color.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate max-w-[56px]">
                        {color.hex}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Typography
              </h3>
              {brandGuidelines.typographies.length === 0 ? (
                <p className="text-sm text-muted-foreground">NA</p>
              ) : (
                <div className="space-y-2">
                  {brandGuidelines.typographies.map((typo, idx) => (
                    <p key={idx} className="text-sm text-foreground">{typo}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Style Visuel */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Style visuel
              </h3>
              {!brandGuidelines.style_visuel ? (
                <p className="text-sm text-muted-foreground">NA</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(brandGuidelines.style_visuel).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs font-medium text-muted-foreground capitalize">{key}:</span>{' '}
                      <span className="text-xs text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Figma URLs */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Figma Files
              </h3>
              {brandGuidelines.figma_urls.length === 0 ? (
                <p className="text-sm text-muted-foreground">NA</p>
              ) : (
                <div className="space-y-2">
                  {brandGuidelines.figma_urls.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{link.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  FIGMA PROJECTS (from DB cache)                              */}
      {/* ============================================================ */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Figma Projects</h2>
          <Badge variant="secondary">{figmaFolders.length} pages</Badge>
          <Button size="sm" variant="outline" className="ml-auto gap-1.5" onClick={refreshFigmaCache} disabled={refreshingFigma}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingFigma ? 'animate-spin' : ''}`} />
            {refreshingFigma ? 'Syncing...' : 'Sync Figma'}
          </Button>
        </div>

        {figmaSyncStates.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {figmaSyncStates.map((state) => (
              <Badge
                key={state.client_id}
                variant={state.status === 'synced' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {state.client_id} — {state.folder_count} pages
                {state.last_synced_at && (
                  <span className="ml-1 text-muted-foreground">
                    ({new Date(state.last_synced_at).toLocaleDateString()})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {figmaFileGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Figma folders cached yet. Click "Sync Figma" to fetch project structure.
          </p>
        ) : (
          <div className="space-y-6">
            {figmaFileGroups.map((group) => (
              <div key={`${group.file_key}`}>
                <div className="flex items-center gap-2 mb-3">
                  <a
                    href={`https://www.figma.com/design/${group.file_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {group.file_name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Badge variant="outline" className="text-[10px]">{group.folders.length} pages</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {group.folders.map((folder) => (
                    <a
                      key={folder.id}
                      href={`https://www.figma.com/design/${folder.file_key}?node-id=${folder.folder_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border overflow-hidden bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div className="aspect-video bg-muted overflow-hidden">
                        {folder.thumbnail_url ? (
                          <img
                            src={folder.thumbnail_url}
                            alt={folder.folder_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{folder.folder_name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  DELIVERABLES (from deliverables table + OneDrive path)      */}
      {/* ============================================================ */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Livrables</h2>
          <Badge variant="secondary">{deliverables?.length ?? 0} documents</Badge>
        </div>

        {/* OneDrive path indicator */}
        {onedrivePath && (
          <div className="flex items-center gap-2 mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-2">
            <CloudIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
              OneDrive: <span className="font-medium">{onedrivePath}</span>
            </p>
          </div>
        )}

        {deliverablesLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading deliverables...</p>
        ) : !deliverables || deliverables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No deliverables yet for this client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Title
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Links
                  </th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => {
                  const sharepoint = d.sharepoint_url;
                  const notion = d.notion_url;
                  const hasLink = !!sharepoint || !!notion;
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium truncate max-w-xs">
                          {d.title ?? d.filename ?? 'Untitled'}
                        </p>
                        {d.filename && d.title && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">{d.filename}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {DELIVERABLE_TYPE_LABELS[d.type] ?? d.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            d.status === 'delivered'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]'
                              : d.status === 'draft'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]'
                                : 'text-[10px]'
                          }
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {sharepoint && (
                            <a
                              href={sharepoint}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <CloudIcon className="w-3 h-3" />
                              SharePoint
                            </a>
                          )}
                          {notion && (
                            <a
                              href={notion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Notion
                            </a>
                          )}
                          {!hasLink && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  ASSET LIBRARY (legacy grid/list)                            */}
      {/* ============================================================ */}
      {resolvedAssets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Asset Library</h2>

          {/* Type Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Button variant="secondary" size="sm">All</Button>
            <Button variant="outline" size="sm">Logos</Button>
            <Button variant="outline" size="sm">Decks</Button>
            <Button variant="outline" size="sm">Guidelines</Button>
            <Button variant="outline" size="sm">Templates</Button>
          </div>

          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {resolvedAssets.map((asset) => (
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
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Version</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Tags</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedAssets.map((asset) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

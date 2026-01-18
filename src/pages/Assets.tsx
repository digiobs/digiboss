import { FolderOpen, Search, Grid3X3, List, Plus, FileText, Image, Palette, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { assets } from '@/data/mockData';
import { useState } from 'react';

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
          {assets.map((asset) => {
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
              {assets.map((asset) => {
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Brand Colors</h3>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary" />
              <div className="w-10 h-10 rounded-lg bg-secondary" />
              <div className="w-10 h-10 rounded-lg bg-accent" />
              <div className="w-10 h-10 rounded-lg bg-muted" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Typography</h3>
            <p className="text-sm text-muted-foreground">
              Primary: Inter<br />
              Secondary: System UI
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Tone of Voice</h3>
            <p className="text-sm text-muted-foreground">
              Professional, Clear, Empowering
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

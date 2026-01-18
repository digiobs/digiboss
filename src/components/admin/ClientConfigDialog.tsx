import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ClientConfig {
  id?: string;
  client_id: string;
  competitors: string[];
  website_url: string | null;
  linkedin_organization_id: string | null;
  hubspot_portal_id: string | null;
  google_analytics_property_id: string | null;
  industry: string;
  market_news_keywords: string[];
}

interface ClientConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSaved?: () => void;
}

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'other', label: 'Other' },
];

export function ClientConfigDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSaved,
}: ClientConfigDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ClientConfig>({
    client_id: clientId,
    competitors: [],
    website_url: '',
    linkedin_organization_id: '',
    hubspot_portal_id: '',
    google_analytics_property_id: '',
    industry: 'technology',
    market_news_keywords: [],
  });
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (open && clientId) {
      fetchConfig();
    }
  }, [open, clientId]);

  const fetchConfig = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('client_configs')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (!error && data) {
      setConfig({
        ...data,
        competitors: data.competitors || [],
        market_news_keywords: data.market_news_keywords || [],
      });
    } else {
      setConfig({
        client_id: clientId,
        competitors: [],
        website_url: '',
        linkedin_organization_id: '',
        hubspot_portal_id: '',
        google_analytics_property_id: '',
        industry: 'technology',
        market_news_keywords: [],
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const payload = {
      client_id: clientId,
      competitors: config.competitors,
      website_url: config.website_url || null,
      linkedin_organization_id: config.linkedin_organization_id || null,
      hubspot_portal_id: config.hubspot_portal_id || null,
      google_analytics_property_id: config.google_analytics_property_id || null,
      industry: config.industry,
      market_news_keywords: config.market_news_keywords,
    };

    const { error } = await supabase
      .from('client_configs')
      .upsert(payload, { onConflict: 'client_id' });

    if (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving config:', error);
    } else {
      toast.success('Configuration saved');
      onSaved?.();
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  const addCompetitor = () => {
    const trimmed = newCompetitor.trim();
    if (trimmed && !config.competitors.includes(trimmed)) {
      setConfig({ ...config, competitors: [...config.competitors, trimmed] });
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setConfig({
      ...config,
      competitors: config.competitors.filter((c) => c !== competitor),
    });
  };

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !config.market_news_keywords.includes(trimmed)) {
      setConfig({
        ...config,
        market_news_keywords: [...config.market_news_keywords, trimmed],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setConfig({
      ...config,
      market_news_keywords: config.market_news_keywords.filter((k) => k !== keyword),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {clientName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Industry */}
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={config.industry}
                onValueChange={(value) => setConfig({ ...config, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={config.website_url || ''}
                onChange={(e) => setConfig({ ...config, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {/* Competitors */}
            <div className="space-y-2">
              <Label>Competitors</Label>
              <p className="text-sm text-muted-foreground">
                Add competitor company names for market monitoring
              </p>
              <div className="flex gap-2">
                <Input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="Add competitor name"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                />
                <Button type="button" variant="secondary" onClick={addCompetitor}>
                  Add
                </Button>
              </div>
              {config.competitors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.competitors.map((competitor) => (
                    <Badge key={competitor} variant="secondary" className="gap-1 pr-1">
                      {competitor}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(competitor)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Market News Keywords */}
            <div className="space-y-2">
              <Label>Market News Keywords</Label>
              <p className="text-sm text-muted-foreground">
                Keywords for customized market news and insights
              </p>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add keyword"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" variant="secondary" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {config.market_news_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.market_news_keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="gap-1 pr-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Integration IDs */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Integration Settings</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_id">LinkedIn Organization ID</Label>
                  <Input
                    id="linkedin_id"
                    value={config.linkedin_organization_id || ''}
                    onChange={(e) =>
                      setConfig({ ...config, linkedin_organization_id: e.target.value })
                    }
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hubspot_id">HubSpot Portal ID</Label>
                  <Input
                    id="hubspot_id"
                    value={config.hubspot_portal_id || ''}
                    onChange={(e) => setConfig({ ...config, hubspot_portal_id: e.target.value })}
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ga_id">Google Analytics Property ID</Label>
                  <Input
                    id="ga_id"
                    value={config.google_analytics_property_id || ''}
                    onChange={(e) =>
                      setConfig({ ...config, google_analytics_property_id: e.target.value })
                    }
                    placeholder="e.g., G-XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

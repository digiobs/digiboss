import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GSC_TOKEN_KEY = 'gsc_tokens';
const GSC_SITE_KEY = 'gsc_site_url';

interface GSCTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface GSCQuery {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: string;
}

interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: string;
}

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

export function useGoogleSearchConsole() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sites, setSites] = useState<GSCSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [queries, setQueries] = useState<GSCQuery[]>([]);
  const [pages, setPages] = useState<GSCPage[]>([]);
  const [totals, setTotals] = useState<{ clicks: number; impressions: number }>({ clicks: 0, impressions: 0 });
  const { toast } = useToast();

  // Load saved tokens and site on mount
  useEffect(() => {
    const savedTokens = localStorage.getItem(GSC_TOKEN_KEY);
    const savedSite = localStorage.getItem(GSC_SITE_KEY);
    
    if (savedTokens) {
      const tokens: GSCTokens = JSON.parse(savedTokens);
      if (tokens.expires_at > Date.now()) {
        setIsConnected(true);
      }
    }
    
    if (savedSite) {
      setSelectedSite(savedSite);
    }
  }, []);

  // Get stored tokens
  const getTokens = useCallback((): GSCTokens | null => {
    const saved = localStorage.getItem(GSC_TOKEN_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  }, []);

  // Save tokens
  const saveTokens = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
    const tokens: GSCTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Date.now() + (expiresIn * 1000),
    };
    localStorage.setItem(GSC_TOKEN_KEY, JSON.stringify(tokens));
    setIsConnected(true);
  }, []);

  // Get OAuth URL
  const getAuthUrl = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-search-console', {
        body: {},
        method: 'GET',
      });

      // For GET request, we need to construct the URL properly
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-search-console/auth-url`;
      const redirectUri = `${window.location.origin}/reporting`;
      
      const response = await fetch(`${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) throw new Error('Failed to get auth URL');
      
      const result = await response.json();
      return result.authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      throw error;
    }
  }, []);

  // Exchange code for tokens
  const exchangeCode = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-search-console/exchange-token', {
        body: { 
          code,
          redirect_uri: `${window.location.origin}/reporting`,
        },
      });

      if (error) throw error;
      
      if (data.access_token && data.refresh_token) {
        saveTokens(data.access_token, data.refresh_token, data.expires_in);
        toast({
          title: "Connected to Google Search Console",
          description: "Successfully authenticated with GSC",
        });
        return true;
      }
      
      throw new Error('Invalid token response');
    } catch (error) {
      console.error('Token exchange failed:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Search Console",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens, toast]);

  // Refresh access token if needed
  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    const tokens = getTokens();
    if (!tokens) return null;

    // If token is still valid, return it
    if (tokens.expires_at > Date.now() + 60000) { // 1 minute buffer
      return tokens.access_token;
    }

    // Refresh the token
    try {
      const { data, error } = await supabase.functions.invoke('google-search-console/refresh-token', {
        body: { refresh_token: tokens.refresh_token },
      });

      if (error) throw error;

      saveTokens(data.access_token, tokens.refresh_token, data.expires_in);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      disconnect();
      return null;
    }
  }, [getTokens, saveTokens]);

  // Fetch available sites
  const fetchSites = useCallback(async () => {
    setIsLoading(true);
    try {
      const accessToken = await ensureValidToken();
      if (!accessToken) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-search-console/sites', {
        body: { access_token: accessToken },
      });

      if (error) throw error;

      const siteList = data.siteEntry || [];
      setSites(siteList);
      
      // Auto-select first site if none selected
      if (siteList.length > 0 && !selectedSite) {
        const firstSite = siteList[0].siteUrl;
        setSelectedSite(firstSite);
        localStorage.setItem(GSC_SITE_KEY, firstSite);
      }

      return siteList;
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Search Console sites",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [ensureValidToken, selectedSite, toast]);

  // Fetch search analytics
  const fetchAnalytics = useCallback(async (startDate: string, endDate: string) => {
    if (!selectedSite) {
      console.log('No site selected');
      return null;
    }

    setIsLoading(true);
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-search-console/analytics', {
        body: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          site_url: selectedSite,
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (error) throw error;

      // Update access token if refreshed
      if (data.newAccessToken) {
        saveTokens(data.newAccessToken, tokens.refresh_token, 3600);
      }

      setQueries(data.queries || []);
      setTotals(data.totals || { clicks: 0, impressions: 0 });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch search analytics",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, getTokens, saveTokens, toast]);

  // Fetch page-level data
  const fetchPages = useCallback(async (startDate: string, endDate: string) => {
    if (!selectedSite) return null;

    setIsLoading(true);
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-search-console/pages', {
        body: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          site_url: selectedSite,
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (error) throw error;

      if (data.newAccessToken) {
        saveTokens(data.newAccessToken, tokens.refresh_token, 3600);
      }

      setPages(data.pages || []);
      return data;
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, getTokens, saveTokens]);

  // Select a site
  const selectSite = useCallback((siteUrl: string) => {
    setSelectedSite(siteUrl);
    localStorage.setItem(GSC_SITE_KEY, siteUrl);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    localStorage.removeItem(GSC_TOKEN_KEY);
    localStorage.removeItem(GSC_SITE_KEY);
    setIsConnected(false);
    setSites([]);
    setSelectedSite(null);
    setQueries([]);
    setPages([]);
    setTotals({ clicks: 0, impressions: 0 });
  }, []);

  return {
    isConnected,
    isLoading,
    sites,
    selectedSite,
    queries,
    pages,
    totals,
    getAuthUrl,
    exchangeCode,
    fetchSites,
    fetchAnalytics,
    fetchPages,
    selectSite,
    disconnect,
  };
}

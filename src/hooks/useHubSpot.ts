import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    company?: string;
    phone?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    pipeline?: string;
    closedate?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    phone?: string;
    city?: string;
    country?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    createdate?: string;
  };
}

export interface HubSpotAnalytics {
  connected: boolean;
  contacts: { total: number };
  deals: { total: number };
  companies: { total: number };
}

export function useHubSpot() {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [analytics, setAnalytics] = useState<HubSpotAnalytics | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const callHubSpot = useCallback(async (action: string, params: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams({ action, ...params }).toString();
    
    const { data, error } = await supabase.functions.invoke('hubspot', {
      body: null,
      method: 'GET',
    });

    // supabase.functions.invoke doesn't support query params well, use fetch
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot?${queryParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }, []);

  const fetchContacts = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const result = await callHubSpot('contacts', { limit: String(limit) });
      
      if (result.error && !result.connected) {
        setIsConnected(false);
        return [];
      }
      
      setContacts(result.results || []);
      setIsConnected(result.connected ?? true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error);
      setIsConnected(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [callHubSpot]);

  const fetchDeals = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const result = await callHubSpot('deals', { limit: String(limit) });
      
      if (result.error && !result.connected) {
        setIsConnected(false);
        return [];
      }
      
      setDeals(result.results || []);
      setIsConnected(result.connected ?? true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error);
      setIsConnected(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [callHubSpot]);

  const fetchCompanies = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const result = await callHubSpot('companies', { limit: String(limit) });
      
      if (result.error && !result.connected) {
        setIsConnected(false);
        return [];
      }
      
      setCompanies(result.results || []);
      setIsConnected(result.connected ?? true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot companies:', error);
      setIsConnected(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [callHubSpot]);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callHubSpot('analytics');
      
      if (result.error && !result.connected) {
        setIsConnected(false);
        return null;
      }
      
      setAnalytics(result);
      setIsConnected(result.connected ?? true);
      return result;
    } catch (error) {
      console.error('Error fetching HubSpot analytics:', error);
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callHubSpot]);

  const checkConnection = useCallback(async () => {
    try {
      const result = await callHubSpot('status');
      setIsConnected(result.connected ?? false);
      return result.connected ?? false;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, [callHubSpot]);

  return {
    isLoading,
    isConnected,
    contacts,
    deals,
    companies,
    analytics,
    fetchContacts,
    fetchDeals,
    fetchCompanies,
    fetchAnalytics,
    checkConnection,
  };
}
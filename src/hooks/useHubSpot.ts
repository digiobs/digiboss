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

  const fetchContacts = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hubspot', {
        body: null,
        method: 'GET',
      });

      // Use fetch directly for GET with query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot/contacts?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }

      const result = await response.json();
      setContacts(result.results || []);
      setIsConnected(true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error);
      setIsConnected(false);
      toast.error('Failed to fetch HubSpot contacts');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot/deals?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deals');
      }

      const result = await response.json();
      setDeals(result.results || []);
      setIsConnected(true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error);
      setIsConnected(false);
      toast.error('Failed to fetch HubSpot deals');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot/companies?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies');
      }

      const result = await response.json();
      setCompanies(result.results || []);
      setIsConnected(true);
      return result.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot companies:', error);
      setIsConnected(false);
      toast.error('Failed to fetch HubSpot companies');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot/analytics`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const result = await response.json();
      setAnalytics(result);
      setIsConnected(true);
      return result;
    } catch (error) {
      console.error('Error fetching HubSpot analytics:', error);
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot/analytics`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      
      if (response.ok) {
        setIsConnected(true);
        return true;
      }
      setIsConnected(false);
      return false;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

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
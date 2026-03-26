import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  color?: string;
}

export const ALL_CLIENTS_ID = '__all_clients__';
export const ALL_CLIENTS_CLIENT: Client = {
  id: ALL_CLIENTS_ID,
  name: 'All clients',
  color: 'blue',
};

export interface ClientConfig {
  id: string;
  client_id: string;
  competitors: string[];
  website_url: string | null;
  linkedin_organization_id: string | null;
  hubspot_portal_id: string | null;
  google_analytics_property_id: string | null;
  industry: string;
  market_news_keywords: string[];
}

interface ClientContextType {
  clients: Client[];
  currentClient: Client | null;
  setCurrentClient: (client: Client | null) => void;
  isAllClientsSelected: boolean;
  clientConfig: ClientConfig | null;
  isLoading: boolean;
  refetchClients: () => Promise<void>;
  refetchConfig: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAllClientsSelected = currentClientId === ALL_CLIENTS_ID;

  const currentClient = useMemo(
    () => {
      if (currentClientId === ALL_CLIENTS_ID) return ALL_CLIENTS_CLIENT;
      return clients.find((c) => c.id === currentClientId) ?? null;
    },
    [clients, currentClientId]
  );

  const setCurrentClient = (client: Client | null) => {
    setCurrentClientId(client?.id ?? null);
  };

  const fetchClients = async () => {
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
    }

    if (!error && data) {
      const normalized: Client[] = (data as Array<{ id: string; name: string; color?: string }>).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? 'blue',
      }));
      setClients(normalized);
      setCurrentClientId((prev) => {
        if (prev === ALL_CLIENTS_ID) return prev;
        const selectedStillExists = prev != null && normalized.some((client) => client.id === prev);
        return selectedStillExists ? prev : normalized[0]?.id ?? null;
      });
    } else if (error) {
      console.error('Error fetching clients:', error);
    }
    setIsLoading(false);
  };

  const fetchClientConfig = async () => {
    if (!currentClient || isAllClientsSelected) {
      setClientConfig(null);
      return;
    }

    const { data, error } = await supabase
      .from('client_configs')
      .select('*')
      .eq('client_id', currentClient.id)
      .maybeSingle();

    if (!error && data) {
      setClientConfig(data as ClientConfig);
    } else {
      // Create default config if none exists
      const { data: newConfig } = await supabase
        .from('client_configs')
        .insert({ client_id: currentClient.id })
        .select()
        .single();
      
      if (newConfig) {
        setClientConfig(newConfig as ClientConfig);
      }
    }
  };

  useEffect(() => {
    fetchClients();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('clients-context-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchClientConfig();
  }, [currentClient?.id]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        currentClient,
        setCurrentClient,
        isAllClientsSelected,
        clientConfig,
        isLoading,
        refetchClients: fetchClients,
        refetchConfig: fetchClientConfig,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

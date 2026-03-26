import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  color?: string;
}

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
  clientConfig: ClientConfig | null;
  isLoading: boolean;
  refetchClients: () => Promise<void>;
  refetchConfig: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setClients(data as Client[]);
      if (data.length > 0 && !currentClient) {
        setCurrentClient(data[0] as Client);
      }
    }
    setIsLoading(false);
  };

  const fetchClientConfig = async () => {
    if (!currentClient) {
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

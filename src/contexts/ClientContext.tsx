import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  color?: string;
}

export const ALL_CLIENTS_ID = '__all_clients__';
export const ALL_CLIENTS_CLIENT: Client = {
  id: ALL_CLIENTS_ID,
  name: 'Admin (all clients)',
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
  /** Whether the current Supabase user is a DigiObs admin (sees all clients) */
  isAdminUser: boolean;
  refetchClients: () => Promise<void>;
  refetchConfig: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** IDs the authenticated user is granted access to (null = no restriction / pre-auth) */
  const allowedClientIds = useRef<Set<string> | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
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

  /**
   * Fetch the authenticated user's role and allowed client IDs.
   * Pre-auth users (no Supabase session) get unrestricted access.
   * Admins get unrestricted access.
   * Team members only see clients listed in user_clients.
   */
  const fetchAccessScope = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      // Pre-auth or anon — no filter
      allowedClientIds.current = null;
      setIsAdminUser(false);
      return;
    }

    const userId = session.user.id;

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.role === 'admin') {
      allowedClientIds.current = null; // admin sees all
      setIsAdminUser(true);
      return;
    }

    setIsAdminUser(false);

    // Non-admin: load their client assignments
    const { data: ucRows } = await supabase
      .from('user_clients')
      .select('client_id')
      .eq('user_id', userId);

    if (ucRows && ucRows.length > 0) {
      allowedClientIds.current = new Set(ucRows.map((r) => r.client_id));
    } else {
      // No assignments → empty set (sees nothing)
      allowedClientIds.current = new Set();
    }
  };

  const fetchClients = async () => {
    // First resolve access scope so we can filter properly
    await fetchAccessScope();

    const colorMissing = (message: string) => message.toLowerCase().includes('column clients.color does not exist');
    let { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (error && colorMissing(error.message)) {
      const fallback = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      data = fallback.data as Array<{ id: string; name: string; color?: string }> | null;
      error = fallback.error;
    }

    if (!error && data) {
      let normalized: Client[] = (data as Array<{ id: string; name: string; color?: string }>).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? 'blue',
      }));

      // Apply client access filter for non-admin authenticated users
      if (allowedClientIds.current != null) {
        normalized = normalized.filter((c) => allowedClientIds.current!.has(c.id));
      }

      setClients(normalized);
      setCurrentClientId((prev) => {
        if (prev === ALL_CLIENTS_ID) return prev;
        const selectedStillExists = prev != null && normalized.some((client) => client.id === prev);
        if (selectedStillExists) return prev;
        return normalized[0]?.id ?? null;
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

    // Refetch when auth state changes (e.g. after login, the session
    // switches from anon → authenticated which may affect RLS).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchClients();
    });

    // Subscribe to realtime changes on clients and user_clients
    const channel = supabase
      .channel('clients-context-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchClients();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_clients' },
        () => {
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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
        isAdminUser,
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

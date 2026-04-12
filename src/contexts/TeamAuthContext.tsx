import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type TeamProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'team_member' | 'admin';
  avatar_url: string | null;
};

interface TeamAuthContextType {
  /** Supabase auth user (null when not logged in) */
  user: User | null;
  /** Profile row from public.profiles (null when not logged in or not a team member) */
  profile: TeamProfile | null;
  isLoading: boolean;
  isTeamMember: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const TeamAuthContext = createContext<TeamAuthContextType | undefined>(undefined);

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the profile row for the given user id.
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[TeamAuth] profile fetch failed:', error.message);
      return null;
    }
    return data as TeamProfile | null;
  };

  useEffect(() => {
    // Listen for auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          const p = await fetchProfile(authUser.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      },
    );

    // Check existing session on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        const p = await fetchProfile(authUser.id);
        setProfile(p);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <TeamAuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isTeamMember: !!profile,
        isAdmin: profile?.role === 'admin',
        signOut,
      }}
    >
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  const context = useContext(TeamAuthContext);
  if (context === undefined) {
    throw new Error('useTeamAuth must be used within a TeamAuthProvider');
  }
  return context;
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  wrike_contact_id: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name') as unknown as { data: TeamMember[] | null; error: { message: string } | null };

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

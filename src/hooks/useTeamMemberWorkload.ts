import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberWorkload {
  member: string;
  activeTasks: number;
  overdueTasks: number;
}

export function useTeamMemberWorkload() {
  return useQuery({
    queryKey: ['team-member-workload'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('plan_tasks')
        .select('assignee, status, due_date')
        .not('status', 'in', '("completed","cancelled","done")') as unknown as {
          data: { assignee: string | null; status: string; due_date: string | null }[] | null;
          error: { message: string } | null;
        };

      if (error) throw new Error(error.message);

      const workloadMap = new Map<string, { active: number; overdue: number }>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const task of data || []) {
        if (!task.assignee) continue;
        const members = task.assignee.split(', ').map((m) => m.trim()).filter(Boolean);
        const isOverdue = task.due_date ? new Date(task.due_date) < today : false;

        for (const member of members) {
          const entry = workloadMap.get(member) || { active: 0, overdue: 0 };
          entry.active++;
          if (isOverdue) entry.overdue++;
          workloadMap.set(member, entry);
        }
      }

      return Array.from(workloadMap.entries()).map(([member, stats]) => ({
        member,
        activeTasks: stats.active,
        overdueTasks: stats.overdue,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}

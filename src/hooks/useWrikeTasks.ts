import { useQuery } from '@tanstack/react-query';
import { getTasks, getSubProjects, getWorkflows } from '@/services/wrike';
import { WRIKE_CLIENTS, WrikeTask, WrikeFolder, parseCustomFields } from '@/types/wrike';

interface UseWrikeTasksOptions {
  clientId?: string; // wrikeId filter
  enabled?: boolean;
}

export function useWrikeTasks({ clientId, enabled = true }: UseWrikeTasksOptions = {}) {
  return useQuery({
    queryKey: ['wrike-tasks', clientId],
    queryFn: async () => {
      if (clientId) {
        // Get tasks for a specific client project
        return await getTasks(clientId);
      }
      // Get tasks for all active clients (first 5 for performance)
      const clients = WRIKE_CLIENTS.filter(c => c.sector !== 'internal').slice(0, 10);
      const allTasks: WrikeTask[] = [];

      const results = await Promise.allSettled(
        clients.map(async (client) => {
          const tasks = await getTasks(client.wrikeId);
          return tasks.map((t) => ({
            ...t,
            clientName: client.name,
            clientSector: client.sector,
          }));
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allTasks.push(...result.value);
        }
      }

      return allTasks;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 2,
  });
}

export function useWrikeSubProjects(clientId: string) {
  return useQuery({
    queryKey: ['wrike-subprojects', clientId],
    queryFn: () => getSubProjects(clientId),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWrikeWorkflows() {
  return useQuery({
    queryKey: ['wrike-workflows'],
    queryFn: getWorkflows,
    staleTime: 30 * 60 * 1000, // Workflows rarely change
  });
}

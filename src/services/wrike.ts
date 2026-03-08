import { supabase } from '@/integrations/supabase/client';
import { WrikeTask, WrikeFolder, parseCustomFields, WRIKE_CLIENTS } from '@/types/wrike';

async function callWrikeProxy(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('wrike-proxy', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Wrike proxy call failed');
  }

  return data;
}

export async function getSubProjects(folderId: string): Promise<WrikeFolder[]> {
  const result = await callWrikeProxy({ action: 'getSubProjects', folderId });
  return result.data || [];
}

export async function getTasks(folderId: string): Promise<WrikeTask[]> {
  const result = await callWrikeProxy({
    action: 'getTasks',
    folderId,
    fields: ['customFields', 'dates', 'status', 'effortAllocation'],
  });
  return (result.data || []).map(parseCustomFields);
}

export async function getAllTasksForFolder(folderId: string): Promise<WrikeTask[]> {
  const result = await callWrikeProxy({
    action: 'getAllTasks',
    folderId,
    fields: ['customFields', 'dates', 'status', 'effortAllocation'],
  });
  return (result.data || []).map(parseCustomFields);
}

export async function updateTaskStatus(taskId: string, customStatusId: string): Promise<void> {
  await callWrikeProxy({ action: 'updateTaskStatus', taskId, status: customStatusId });
}

export async function getWorkflows() {
  const result = await callWrikeProxy({ action: 'getWorkflows' });
  return result.data || [];
}

export async function getFolderTree(folderId: string): Promise<WrikeFolder[]> {
  const result = await callWrikeProxy({ action: 'getFolderTree', folderId });
  return result.data || [];
}

// Enrich tasks with client info based on parent folder mapping
export function enrichTasksWithClient(
  tasks: WrikeTask[],
  folderClientMap: Map<string, { name: string; sector: string }>
): WrikeTask[] {
  return tasks.map((task) => {
    const parentId = task.parentIds?.[0];
    if (parentId) {
      const client = folderClientMap.get(parentId);
      if (client) {
        return { ...task, clientName: client.name, clientSector: client.sector };
      }
    }
    return task;
  });
}

// Build a mapping from monthly sub-folder IDs to client info
export async function buildFolderClientMap(): Promise<Map<string, { name: string; sector: string }>> {
  const map = new Map<string, { name: string; sector: string }>();

  // For each client, get their sub-projects and map folder IDs
  const promises = WRIKE_CLIENTS.filter(c => c.sector !== 'internal').map(async (client) => {
    try {
      const subProjects = await getSubProjects(client.wrikeId);
      for (const sp of subProjects) {
        map.set(sp.id, { name: client.name, sector: client.sector || 'industrial' });
      }
      // Also map the parent project ID itself
      map.set(client.wrikeId, { name: client.name, sector: client.sector || 'industrial' });
    } catch (err) {
      console.warn(`Failed to fetch sub-projects for ${client.name}:`, err);
    }
  });

  await Promise.all(promises);
  return map;
}

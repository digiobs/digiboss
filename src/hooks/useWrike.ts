import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority } from '@/types/tasks';

export interface WrikeTask {
  id: string;
  title: string;
  description?: string;
  briefDescription?: string;
  status: string;
  importance: string;
  dates?: {
    start?: string;
    due?: string;
    duration?: number;
  };
  responsibleIds?: string[];
  parentIds?: string[];
  customFields?: Array<{
    id: string;
    value: string;
  }>;
  hasAttachments?: boolean;
  subTaskIds?: string[];
}

export interface WrikeFolder {
  id: string;
  title: string;
  childIds?: string[];
  scope: string;
  project?: {
    authorId: string;
    ownerIds: string[];
    status: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface WrikeContact {
  id: string;
  firstName: string;
  lastName: string;
  profiles?: Array<{
    email: string;
    role: string;
  }>;
}

export interface WrikeSpace {
  id: string;
  title: string;
  avatarUrl?: string;
  accessType: string;
}

export function useWrike() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<WrikeTask[]>([]);
  const [folders, setFolders] = useState<WrikeFolder[]>([]);
  const [contacts, setContacts] = useState<WrikeContact[]>([]);
  const [spaces, setSpaces] = useState<WrikeSpace[]>([]);

  const callWrike = useCallback(async (action: string, params: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams({ action, ...params });
    
    const { data, error } = await supabase.functions.invoke('wrike', {
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Actually call with query params
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wrike?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch from Wrike');
    }

    return response.json();
  }, []);

  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callWrike('account');
      setConnected(true);
      console.log('Wrike connected:', result);
      return true;
    } catch (error) {
      console.error('Wrike connection check failed:', error);
      setConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [callWrike]);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callWrike('spaces');
      setSpaces(result.data || []);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch Wrike spaces:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callWrike]);

  const fetchFolders = useCallback(async (spaceId?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (spaceId) params.spaceId = spaceId;
      const result = await callWrike('folders', params);
      setFolders(result.data || []);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch Wrike folders:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callWrike]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callWrike('contacts');
      setContacts(result.data || []);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch Wrike contacts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callWrike]);

  const fetchTasks = useCallback(async (folderId?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (folderId) params.folderId = folderId;
      const result = await callWrike('tasks', params);
      setTasks(result.data || []);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch Wrike tasks:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callWrike]);

  // Map Wrike status to local TaskStatus
  const mapWrikeStatus = (wrikeStatus: string): TaskStatus => {
    const statusLower = wrikeStatus.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('done')) {
      return 'done';
    }
    if (statusLower.includes('progress') || statusLower.includes('active')) {
      return 'doing';
    }
    if (statusLower.includes('review') || statusLower.includes('pending')) {
      return 'review';
    }
    return 'backlog';
  };

  // Map Wrike importance to local TaskPriority
  const mapWrikePriority = (importance: string): TaskPriority => {
    const importanceLower = importance.toLowerCase();
    if (importanceLower === 'high') return 'high';
    if (importanceLower === 'low') return 'low';
    return 'medium';
  };

  // Convert Wrike tasks to local Task format
  const convertToLocalTasks = useCallback((wrikeTasks: WrikeTask[], contactsList: WrikeContact[]): Task[] => {
    const contactMap = new Map(
      contactsList.map(c => [c.id, `${c.firstName} ${c.lastName}`])
    );

    return wrikeTasks.map(wt => ({
      id: wt.id,
      title: wt.title,
      description: wt.description || wt.briefDescription || '',
      status: mapWrikeStatus(wt.status),
      priority: mapWrikePriority(wt.importance),
      assignee: wt.responsibleIds?.[0] ? contactMap.get(wt.responsibleIds[0]) || null : null,
      dueDate: wt.dates?.due || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      subtasks: [],
      comments: [],
      estimatedHours: wt.dates?.duration ? Math.round(wt.dates.duration / 60) : undefined,
      wrikeId: wt.id,
    }));
  }, []);

  return {
    loading,
    connected,
    tasks,
    folders,
    contacts,
    spaces,
    checkConnection,
    fetchSpaces,
    fetchFolders,
    fetchContacts,
    fetchTasks,
    convertToLocalTasks,
    callWrike,
  };
}

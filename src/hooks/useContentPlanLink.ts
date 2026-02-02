import { useState, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/tasks';
import { ContentItem, ContentOpportunity, contentTypeLabels } from '@/types/content';
import { toast } from 'sonner';

interface UseContentPlanLinkReturn {
  createTaskFromOpportunity: (opportunity: ContentOpportunity) => Task;
  createTaskFromContent: (content: ContentItem) => Task;
  getLinkedTasks: (contentId: string) => Task[];
  addTask: (task: Task) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useContentPlanLink(initialTasks: Task[] = []): UseContentPlanLinkReturn {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const createTaskFromOpportunity = useCallback((opportunity: ContentOpportunity): Task => {
    const newTask: Task = {
      id: `content-opp-${Date.now()}`,
      title: `Create: ${opportunity.suggestedTitle}`,
      description: `${opportunity.suggestedAngle}\n\nWhy now:\n${opportunity.whyNow.map(w => `• ${w}`).join('\n')}`,
      status: 'backlog' as TaskStatus,
      priority: opportunity.opportunityScore >= 80 ? 'high' : opportunity.opportunityScore >= 60 ? 'medium' : 'low' as TaskPriority,
      assignee: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [contentTypeLabels[opportunity.contentType], opportunity.funnelStage, 'content'],
      subtasks: [
        { id: `s-${Date.now()}-1`, title: 'Draft content', completed: false },
        { id: `s-${Date.now()}-2`, title: 'Review & approve', completed: false },
        { id: `s-${Date.now()}-3`, title: 'Schedule/publish', completed: false },
      ],
      comments: [],
      linkedContentId: opportunity.id,
      linkedContentType: 'opportunity',
      sourceModule: 'content-creator',
    };
    return newTask;
  }, []);

  const createTaskFromContent = useCallback((content: ContentItem): Task => {
    const newTask: Task = {
      id: `content-item-${Date.now()}`,
      title: `Produce: ${content.title}`,
      description: `Content production task for ${contentTypeLabels[content.contentType]}`,
      status: 'backlog' as TaskStatus,
      priority: 'medium' as TaskPriority,
      assignee: content.owner || null,
      dueDate: content.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [contentTypeLabels[content.contentType], content.funnelStage, 'content'],
      subtasks: [],
      comments: [],
      linkedContentId: content.id,
      linkedContentType: 'content-item',
      sourceModule: 'content-creator',
    };
    return newTask;
  }, []);

  const getLinkedTasks = useCallback((contentId: string): Task[] => {
    return tasks.filter(task => task.linkedContentId === contentId);
  }, [tasks]);

  const addTask = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev]);
    toast.success(`Task created: "${task.title}"`);
  }, []);

  return {
    createTaskFromOpportunity,
    createTaskFromContent,
    getLinkedTasks,
    addTask,
    tasks,
    setTasks,
  };
}

// Event-based cross-page communication
export const CONTENT_TASK_CREATED_EVENT = 'content-task-created';

export function dispatchContentTaskCreated(task: Task) {
  window.dispatchEvent(new CustomEvent(CONTENT_TASK_CREATED_EVENT, { detail: task }));
}

export function subscribeToContentTasks(callback: (task: Task) => void) {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<Task>;
    callback(customEvent.detail);
  };
  window.addEventListener(CONTENT_TASK_CREATED_EVENT, handler);
  return () => window.removeEventListener(CONTENT_TASK_CREATED_EVENT, handler);
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskFormData } from '@/types/tasks';
import { WRIKE_FIELDS } from '@/types/wrike';

interface UseCreateTaskOptions {
  onSuccess?: () => void;
}

export function useCreateTask({ onSuccess }: UseCreateTaskOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskFormData & { id?: string }) => {
      const assigneeString = data.assigneeIds.map((a) => a.name).join(', ');
      const isEdit = !!data.id;

      // Derive monthly batch id from dueDate (falls back to today) when the
      // caller didn't explicitly set it — keeps the /actions view populated
      // for tasks created through the existing UI paths.
      const derivePeriod = (): string | null => {
        if (data.period) return data.period;
        const source = data.dueDate ? new Date(data.dueDate) : new Date();
        if (Number.isNaN(source.getTime())) return null;
        return `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, '0')}`;
      };

      const row = {
        client_id: data.clientId,
        title: data.title,
        description: data.description || null,
        task_type: data.taskType,
        task_nature: data.taskNature || null,
        idea_source: data.ideaSource || null,
        idea_source_detail: data.ideaSourceDetail || null,
        idea_source_url: data.ideaSourceUrl || null,
        source_proposal_id: data.sourceProposalId || null,
        status: data.status,
        priority: data.priority,
        canal: data.canal || null,
        format: data.format || null,
        thematique: data.thematique || null,
        start_date: data.startDate || null,
        due_date: data.dueDate || null,
        mot_cle_cible: data.motCleCible || null,
        nombre_mots: data.nombreMots || null,
        effort_reserve: data.effortReserve || null,
        resource_links: data.resourceLinks,
        assignee: assigneeString || null,
        assignee_ids: data.assigneeIds,
        tags: data.tags,
        budget_tache: data.budgetTache || null,
        tarif_catalogue: data.tarifCatalogue || null,
        forfait_mensuel: data.forfaitMensuel || null,
        sous_traitance: data.sousTraitance || null,
        marge: data.marge || null,
        sync_to_wrike: data.syncToWrike,
        content_type: data.contentType || null,
        content_status: data.contentStatus || null,
        funnel_stage: data.funnelStage || null,
        period: derivePeriod(),
      };

      if (isEdit) {
        const { error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
          .from('plan_tasks')
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq('id', data.id) as unknown as { error: { message: string } | null };

        if (error) throw new Error(error.message);
        return { id: data.id!, clientId: data.clientId };
      }

      const { data: insertedTask, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('plan_tasks')
        .insert({ ...row, ai_generated: false })
        .select('id, client_id')
        .single() as unknown as {
          data: { id: string; client_id: string } | null;
          error: { message: string } | null;
        };

      if (error) throw new Error(error.message);
      if (!insertedTask) throw new Error('Insertion failed');

      // Optionally sync to Wrike
      if (data.syncToWrike) {
        try {
          await syncTaskToWrike(insertedTask.id, data);
        } catch (err) {
          console.warn('[useCreateTask] Wrike sync failed:', err);
          toast.error('Tâche créée mais la synchronisation Wrike a échoué');
        }
      }

      return insertedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['plan-tasks-by-type'] });
      queryClient.invalidateQueries({ queryKey: ['wrike-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['client-avancement'] });
      queryClient.invalidateQueries({ queryKey: ['content-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-actions'] });
      toast.success('Tâche enregistrée avec succès');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

async function syncTaskToWrike(taskId: string, data: TaskFormData) {
  // Build Wrike custom fields from form data
  const customFields: { id: string; value: string | number }[] = [];

  if (data.canal) customFields.push({ id: WRIKE_FIELDS.CANAL_DIFFUSION, value: data.canal });
  if (data.format) customFields.push({ id: WRIKE_FIELDS.FORMAT, value: data.format });
  if (data.thematique) customFields.push({ id: WRIKE_FIELDS.THEMATIQUE, value: data.thematique });
  if (data.motCleCible) customFields.push({ id: WRIKE_FIELDS.MOT_CLE_CIBLE, value: data.motCleCible });
  if (data.nombreMots) customFields.push({ id: WRIKE_FIELDS.NOMBRE_MOTS, value: data.nombreMots });
  if (data.effortReserve) customFields.push({ id: WRIKE_FIELDS.EFFORT_RESERVE, value: data.effortReserve });
  if (data.budgetTache) customFields.push({ id: WRIKE_FIELDS.BUDGET_TACHE, value: data.budgetTache });
  if (data.tarifCatalogue) customFields.push({ id: WRIKE_FIELDS.TARIF_CATALOGUE, value: data.tarifCatalogue });
  if (data.forfaitMensuel) customFields.push({ id: WRIKE_FIELDS.FORFAIT_MENSUEL, value: data.forfaitMensuel });
  if (data.sousTraitance) customFields.push({ id: WRIKE_FIELDS.SOUS_TRAITANCE, value: data.sousTraitance });

  // Resource links as custom fields
  for (const link of data.resourceLinks) {
    if (link.type === 'figma' && link.url) {
      customFields.push({ id: WRIKE_FIELDS.LIEN_FIGMA, value: link.url });
    } else if (link.type === 'gdocs' && link.url) {
      customFields.push({ id: WRIKE_FIELDS.LIEN_CONTENU_REDAC, value: link.url });
    } else if (link.type === 'page' && link.url) {
      customFields.push({ id: WRIKE_FIELDS.LIEN_CONTENU_PROD, value: link.url });
    }
  }

  const importanceMap: Record<string, string> = {
    high: 'High',
    medium: 'Normal',
    low: 'Low',
  };

  const taskData: Record<string, unknown> = {
    title: data.title,
    description: data.description || undefined,
    importance: importanceMap[data.priority] || 'Normal',
    customFields: customFields.length > 0 ? customFields : undefined,
  };

  if (data.startDate || data.dueDate) {
    taskData.dates = {
      ...(data.startDate ? { start: data.startDate } : {}),
      ...(data.dueDate ? { due: data.dueDate } : {}),
      type: 'Planned',
    };
  }

  // Resolve Wrike responsible IDs from assignees
  const wrikeResponsibleIds = data.assigneeIds
    .filter((a) => a.wrikeContactId)
    .map((a) => a.wrikeContactId!);
  if (wrikeResponsibleIds.length > 0) {
    taskData.responsibles = wrikeResponsibleIds;
  }

  // Call the edge function
  const { data: result, error } = await supabase.functions.invoke('wrike-create-task', {
    body: { taskId, taskData, clientId: data.clientId },
  });

  if (error) throw error;
  return result;
}

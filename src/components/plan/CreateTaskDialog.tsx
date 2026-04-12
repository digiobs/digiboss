import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createTaskSchema } from '@/lib/schemas/createTaskSchema';
import { useCreateTask } from '@/hooks/useCreateTask';
import { TaskTypeSelector } from './task-form/TaskTypeSelector';
import { BasicInfoTab } from './task-form/BasicInfoTab';
import { PlanningTab } from './task-form/PlanningTab';
import { ProductionTab } from './task-form/ProductionTab';
import { AdminFinanceTab } from './task-form/AdminFinanceTab';
import { TeamMemberPicker } from './task-form/TeamMemberPicker';
import type { TaskFormData, TaskType } from '@/types/tasks';
import { Loader2, LayoutGrid } from 'lucide-react';

interface PlanTaskRow {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  status: string;
  priority: string;
  canal: string | null;
  format: string | null;
  thematique: string | null;
  start_date: string | null;
  due_date: string | null;
  mot_cle_cible: string | null;
  nombre_mots: number | null;
  effort_reserve: number | null;
  resource_links: { type: string; url: string; label: string }[] | null;
  assignee: string | null;
  assignee_ids: { id: string; name: string; wrikeContactId?: string }[] | null;
  tags: string[] | null;
  budget_tache: number | null;
  tarif_catalogue: number | null;
  forfait_mensuel: number | null;
  sous_traitance: number | null;
  marge: number | null;
  sync_to_wrike: boolean | null;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  defaultClientId?: string;
  clientName?: string;
  task?: PlanTaskRow;
}

function getDefaultValues(defaultClientId?: string, task?: PlanTaskRow): TaskFormData {
  if (task) {
    return {
      title: task.title || '',
      description: task.description || '',
      taskType: (task.task_type as TaskType) || 'autre',
      clientId: task.client_id || defaultClientId || '',
      canal: (task.canal as TaskFormData['canal']) || '',
      format: (task.format as TaskFormData['format']) || '',
      thematique: task.thematique || '',
      startDate: task.start_date || null,
      dueDate: task.due_date || null,
      priority: (task.priority as TaskFormData['priority']) || 'medium',
      status: (task.status as TaskFormData['status']) || 'backlog',
      motCleCible: task.mot_cle_cible || '',
      nombreMots: task.nombre_mots || null,
      resourceLinks: task.resource_links || [],
      effortReserve: task.effort_reserve ? Number(task.effort_reserve) : null,
      assigneeIds: task.assignee_ids || [],
      tags: task.tags || [],
      budgetTache: task.budget_tache ? Number(task.budget_tache) : null,
      tarifCatalogue: task.tarif_catalogue ? Number(task.tarif_catalogue) : null,
      forfaitMensuel: task.forfait_mensuel ? Number(task.forfait_mensuel) : null,
      sousTraitance: task.sous_traitance ? Number(task.sous_traitance) : null,
      marge: task.marge ? Number(task.marge) : null,
      syncToWrike: task.sync_to_wrike || false,
    };
  }

  return {
    title: '',
    description: '',
    taskType: 'autre',
    clientId: defaultClientId || '',
    canal: '',
    format: '',
    thematique: '',
    startDate: null,
    dueDate: null,
    priority: 'medium',
    status: 'backlog',
    motCleCible: '',
    nombreMots: null,
    resourceLinks: [],
    effortReserve: null,
    assigneeIds: [],
    tags: [],
    budgetTache: null,
    tarifCatalogue: null,
    forfaitMensuel: null,
    sousTraitance: null,
    marge: null,
    syncToWrike: false,
  };
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  isAdmin,
  defaultClientId,
  clientName,
  task,
}: CreateTaskDialogProps) {
  const isEdit = !!task;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: getDefaultValues(defaultClientId, task),
  });

  const { mutate, isPending } = useCreateTask({
    onSuccess: () => {
      onOpenChange(false);
      form.reset(getDefaultValues(defaultClientId));
    },
  });

  // Reset form when dialog opens with different task
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(defaultClientId, task));
    }
  }, [open, task?.id, defaultClientId]);

  const onSubmit = (data: TaskFormData) => {
    if (isEdit && task) {
      mutate({ ...data, id: task.id });
    } else {
      mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de la tâche.'
              : 'Créez une nouvelle tâche avec tous les champs Wrike.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Task Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type de tâche</Label>
            <TaskTypeSelector
              value={form.watch('taskType')}
              onChange={(v) => form.setValue('taskType', v)}
            />
          </div>

          {/* Tabbed sections */}
          <Tabs defaultValue="infos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="infos">Informations</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="infos" className="mt-4">
              <BasicInfoTab form={form} clientName={clientName} />
            </TabsContent>

            <TabsContent value="planning" className="mt-4">
              <PlanningTab form={form} />
            </TabsContent>

            <TabsContent value="production" className="mt-4">
              <ProductionTab form={form} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="mt-4">
                <AdminFinanceTab form={form} />
              </TabsContent>
            )}
          </Tabs>

          {/* Team Member Picker (always visible) */}
          <TeamMemberPicker form={form} />

          {/* Wrike sync toggle */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="syncToWrike"
              checked={form.watch('syncToWrike')}
              onCheckedChange={(checked) => form.setValue('syncToWrike', checked === true)}
            />
            <Label htmlFor="syncToWrike" className="text-sm cursor-pointer">
              Synchroniser avec Wrike
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Enregistrement...' : 'Création...'}
                </>
              ) : (
                isEdit ? 'Enregistrer' : 'Créer la tâche'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

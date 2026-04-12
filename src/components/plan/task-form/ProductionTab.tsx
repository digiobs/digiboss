import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourceLinksEditor } from './ResourceLinksEditor';
import type { TaskFormData, TaskType } from '@/types/tasks';
import {
  contentTypeLabels,
  contentStatusLabels,
  funnelStageLabels,
  type ContentType,
  type ContentStatus,
  type FunnelStage,
} from '@/types/content';

interface ProductionTabProps {
  form: UseFormReturn<TaskFormData>;
}

export function ProductionTab({ form }: ProductionTabProps) {
  const taskType = form.watch('taskType') as TaskType;
  const showSeo = taskType === 'seo' || taskType === 'contenu';
  const showWordCount = taskType === 'contenu';
  const showContentFields = taskType === 'contenu';

  const contentType = form.watch('contentType') ?? '';
  const contentStatus = form.watch('contentStatus') ?? '';
  const funnelStage = form.watch('funnelStage') ?? '';

  return (
    <div className="grid gap-4">
      {/* Content-item fields (shown only for task_type=contenu) */}
      {showContentFields && (
        <div className="grid gap-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="grid gap-2">
            <Label htmlFor="contentType">
              Type de contenu <span className="text-destructive">*</span>
            </Label>
            <Select
              value={contentType || undefined}
              onValueChange={(v) => form.setValue('contentType', v as ContentType, { shouldValidate: true })}
            >
              <SelectTrigger id="contentType">
                <SelectValue placeholder="Choisir un type..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(contentTypeLabels) as ContentType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {contentTypeLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.contentType && (
              <p className="text-xs text-destructive">{form.formState.errors.contentType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="contentStatus">Statut éditorial</Label>
              <Select
                value={contentStatus || undefined}
                onValueChange={(v) => form.setValue('contentStatus', v as ContentStatus)}
              >
                <SelectTrigger id="contentStatus">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(contentStatusLabels) as ContentStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {contentStatusLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="funnelStage">Funnel stage</Label>
              <Select
                value={funnelStage || undefined}
                onValueChange={(v) => form.setValue('funnelStage', v as FunnelStage)}
              >
                <SelectTrigger id="funnelStage">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(funnelStageLabels) as FunnelStage[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {funnelStageLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* SEO keyword */}
      {showSeo && (
        <div className="grid gap-2">
          <Label htmlFor="motCleCible">Mot-clé cible</Label>
          <Input
            id="motCleCible"
            placeholder="Ex: marketing automation B2B"
            {...form.register('motCleCible')}
          />
        </div>
      )}

      {/* Word count */}
      {showWordCount && (
        <div className="grid gap-2">
          <Label htmlFor="nombreMots">Nombre de mots</Label>
          <Input
            id="nombreMots"
            type="number"
            min="0"
            step="100"
            placeholder="Ex: 1500"
            {...form.register('nombreMots', { valueAsNumber: true })}
          />
        </div>
      )}

      {/* Resource links */}
      <ResourceLinksEditor form={form} />

      {!showSeo && !showWordCount && (
        <p className="text-sm text-muted-foreground py-2">
          Les champs SEO et nombre de mots apparaissent pour les types "Contenu" et "SEO".
        </p>
      )}
    </div>
  );
}

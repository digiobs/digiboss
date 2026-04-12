import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResourceLinksEditor } from './ResourceLinksEditor';
import type { TaskFormData, TaskType } from '@/types/tasks';

interface ProductionTabProps {
  form: UseFormReturn<TaskFormData>;
}

export function ProductionTab({ form }: ProductionTabProps) {
  const taskType = form.watch('taskType') as TaskType;
  const showSeo = taskType === 'seo' || taskType === 'contenu';
  const showWordCount = taskType === 'contenu';

  return (
    <div className="grid gap-4">
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

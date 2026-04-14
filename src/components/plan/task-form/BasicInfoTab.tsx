import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STATUS_OPTIONS,
  TASK_NATURE_OPTIONS,
  IDEA_SOURCE_OPTIONS,
  type TaskFormData,
  type TaskNature,
  type IdeaSource,
} from '@/types/tasks';
import { useMemo, useState } from 'react';

interface BasicInfoTabProps {
  form: UseFormReturn<TaskFormData>;
  clientName?: string;
}

export function BasicInfoTab({ form, clientName }: BasicInfoTabProps) {
  const [tagInput, setTagInput] = useState('');
  const tags = form.watch('tags');
  const currentTaskType = form.watch('taskType');
  const currentIdeaSource = form.watch('ideaSource');

  // Nature options filtered by the coarse task_type, so switching "Type de
  // tâche" keeps the Nature picker relevant. Fallback: show everything if the
  // filter removes all options.
  const natureOptions = useMemo(() => {
    const filtered = TASK_NATURE_OPTIONS.filter((o) => o.group === currentTaskType);
    return filtered.length > 0 ? filtered : TASK_NATURE_OPTIONS;
  }, [currentTaskType]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const current = form.getValues('tags');
      if (!current.includes(tagInput.trim())) {
        form.setValue('tags', [...current, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="grid gap-4">
      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          placeholder="Titre de la tâche..."
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description de la tâche..."
          rows={3}
          {...form.register('description')}
        />
      </div>

      {/* Client (readonly) */}
      {clientName && (
        <div className="grid gap-2">
          <Label>Client</Label>
          <Input value={clientName} disabled className="bg-muted" />
        </div>
      )}

      {/* Nature précise de la tâche (Wrike-aligned) */}
      <div className="grid gap-2">
        <Label>Nature précise</Label>
        <Select
          value={form.watch('taskNature') ?? ''}
          onValueChange={(v) =>
            form.setValue('taskNature', v ? (v as TaskNature) : null)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner (post LinkedIn, audit SEO, rapport data...)" />
          </SelectTrigger>
          <SelectContent>
            {natureOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Reprend les types d'éléments personnalisés Wrike (post LinkedIn, audit SEO,
          rapport data, …).
        </p>
      </div>

      {/* Source de l'idée */}
      <div className="grid gap-2">
        <Label>Source de l'idée</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={form.watch('ideaSource') ?? ''}
            onValueChange={(v) =>
              form.setValue('ideaSource', v ? (v as IdeaSource) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="D'où vient cette idée ?" />
            </SelectTrigger>
            <SelectContent>
              {IDEA_SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={
              currentIdeaSource === 'meeting'
                ? 'Nom du meeting...'
                : currentIdeaSource === 'veille'
                  ? 'Article de veille...'
                  : 'Précision sur la source'
            }
            {...form.register('ideaSourceDetail')}
          />
        </div>
        <Input
          placeholder="URL de la source (optionnel)"
          {...form.register('ideaSourceUrl')}
        />
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Statut</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => form.setValue('status', v as TaskFormData['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Priorité</Label>
          <Select
            value={form.watch('priority')}
            onValueChange={(v) => form.setValue('priority', v as TaskFormData['priority'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Ajouter un tag (Entrée)..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

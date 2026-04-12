import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskFormData, ResourceLink } from '@/types/tasks';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ResourceLinksEditorProps {
  form: UseFormReturn<TaskFormData>;
}

const LINK_TYPES: { value: ResourceLink['type']; label: string }[] = [
  { value: 'figma', label: 'Figma' },
  { value: 'gdocs', label: 'Google Docs' },
  { value: 'page', label: 'Page web' },
  { value: 'other', label: 'Autre' },
];

export function ResourceLinksEditor({ form }: ResourceLinksEditorProps) {
  const links = form.watch('resourceLinks');
  const [newType, setNewType] = useState<ResourceLink['type']>('gdocs');
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const addLink = () => {
    if (!newUrl.trim()) return;
    const label = newLabel.trim() || LINK_TYPES.find((t) => t.value === newType)?.label || 'Lien';
    form.setValue('resourceLinks', [
      ...links,
      { type: newType, url: newUrl.trim(), label },
    ]);
    setNewUrl('');
    setNewLabel('');
  };

  const removeLink = (index: number) => {
    form.setValue('resourceLinks', links.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-3">
      <Label>Liens ressources</Label>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
              <span className="font-medium text-xs uppercase text-muted-foreground w-16 shrink-0">
                {link.type}
              </span>
              <span className="truncate flex-1">{link.label}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs truncate max-w-[200px]"
              >
                {link.url}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeLink(i)}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new link */}
      <div className="flex items-end gap-2">
        <div className="w-28">
          <Select value={newType} onValueChange={(v) => setNewType(v as ResourceLink['type'])}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="URL..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="h-9 flex-1"
        />
        <Input
          placeholder="Label (optionnel)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="h-9 w-32"
        />
        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={addLink}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

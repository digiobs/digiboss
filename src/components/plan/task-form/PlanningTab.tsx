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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CANAL_OPTIONS, CANAL_FORMAT_MAP, type Canal, type TaskFormData } from '@/types/tasks';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PlanningTabProps {
  form: UseFormReturn<TaskFormData>;
}

export function PlanningTab({ form }: PlanningTabProps) {
  const canal = form.watch('canal');
  const formatOptions = canal ? CANAL_FORMAT_MAP[canal as Canal] || [] : [];

  const startDate = form.watch('startDate');
  const dueDate = form.watch('dueDate');

  return (
    <div className="grid gap-4">
      {/* Canal & Format */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Canal de diffusion</Label>
          <Select
            value={canal || '_none'}
            onValueChange={(v) => {
              form.setValue('canal', v === '_none' ? '' : v as Canal);
              form.setValue('format', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Aucun</SelectItem>
              {CANAL_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.canal && (
            <p className="text-xs text-destructive">{form.formState.errors.canal.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Format</Label>
          <Select
            value={form.watch('format') || '_none'}
            onValueChange={(v) => form.setValue('format', v === '_none' ? '' : v as TaskFormData['format'])}
            disabled={formatOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={formatOptions.length === 0 ? 'Choisir un canal d\'abord' : 'Sélectionner...'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Aucun</SelectItem>
              {formatOptions.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.format && (
            <p className="text-xs text-destructive">{form.formState.errors.format.message}</p>
          )}
        </div>
      </div>

      {/* Thématique */}
      <div className="grid gap-2">
        <Label htmlFor="thematique">Thématique</Label>
        <Input
          id="thematique"
          placeholder="Sujet / thème..."
          {...form.register('thematique')}
        />
      </div>

      {/* Start Date & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(parseISO(startDate), 'dd MMM yyyy', { locale: fr }) : 'Choisir...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? parseISO(startDate) : undefined}
                onSelect={(d) => form.setValue('startDate', d ? format(d, 'yyyy-MM-dd') : null)}
                locale={fr}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label>Date d'échéance</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(parseISO(dueDate), 'dd MMM yyyy', { locale: fr }) : 'Choisir...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate ? parseISO(dueDate) : undefined}
                onSelect={(d) => form.setValue('dueDate', d ? format(d, 'yyyy-MM-dd') : null)}
                locale={fr}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Effort */}
      <div className="grid gap-2">
        <Label htmlFor="effortReserve">Effort réservé (heures)</Label>
        <Input
          id="effortReserve"
          type="number"
          step="0.5"
          min="0"
          placeholder="Ex: 4.5"
          {...form.register('effortReserve', { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}

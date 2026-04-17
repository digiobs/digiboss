import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaskFormData } from '@/types/tasks';

interface AdminFinanceTabProps {
  form: UseFormReturn<TaskFormData>;
}

export function AdminFinanceTab({ form }: AdminFinanceTabProps) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        Données financières (admin uniquement)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="budgetTache">Budget tâche (€)</Label>
          <Input
            id="budgetTache"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...form.register('budgetTache', { valueAsNumber: true })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tarifCatalogue">Tarif catalogue (€)</Label>
          <Input
            id="tarifCatalogue"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...form.register('tarifCatalogue', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="forfaitMensuel">Forfait mensuel (€)</Label>
          <Input
            id="forfaitMensuel"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...form.register('forfaitMensuel', { valueAsNumber: true })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sousTraitance">Sous-traitance (€)</Label>
          <Input
            id="sousTraitance"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...form.register('sousTraitance', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="marge">Marge (€)</Label>
        <Input
          id="marge"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...form.register('marge', { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}

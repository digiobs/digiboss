import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useTeamMemberWorkload } from '@/hooks/useTeamMemberWorkload';
import type { TaskFormData, TeamMemberRef } from '@/types/tasks';
import { Check, ChevronsUpDown, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMemberPickerProps {
  form: UseFormReturn<TaskFormData>;
}

export function TeamMemberPicker({ form }: TeamMemberPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: members = [], isLoading } = useTeamMembers();
  const { data: workloads = [] } = useTeamMemberWorkload();
  const selected = form.watch('assigneeIds');

  const getWorkload = (name: string) => {
    return workloads.find((w) => w.member === name);
  };

  const toggleMember = (member: { id: string; name: string; wrike_contact_id: string | null }) => {
    const current = form.getValues('assigneeIds');
    const exists = current.find((m) => m.id === member.id);
    if (exists) {
      form.setValue('assigneeIds', current.filter((m) => m.id !== member.id));
    } else {
      const ref: TeamMemberRef = {
        id: member.id,
        name: member.name,
        wrikeContactId: member.wrike_contact_id || undefined,
      };
      form.setValue('assigneeIds', [...current, ref]);
    }
  };

  const removeMember = (memberId: string) => {
    form.setValue('assigneeIds', selected.filter((m) => m.id !== memberId));
  };

  return (
    <div className="grid gap-2">
      <Label>Chargé(s) de tâche</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between font-normal"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {selected.length === 0
                ? 'Sélectionner des membres...'
                : `${selected.length} membre${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Chargement...' : 'Aucun membre trouvé.'}
              </CommandEmpty>
              <CommandGroup>
                {members.map((member) => {
                  const isSelected = selected.some((m) => m.id === member.id);
                  const workload = getWorkload(member.name);
                  return (
                    <CommandItem
                      key={member.id}
                      value={member.name}
                      onSelect={() => toggleMember(member)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span>{member.name}</span>
                        {member.role !== 'member' && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">{member.role}</Badge>
                        )}
                      </div>
                      {workload && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{workload.activeTasks} active{workload.activeTasks > 1 ? 's' : ''}</span>
                          {workload.overdueTasks > 0 && (
                            <span className="flex items-center gap-0.5 text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              {workload.overdueTasks}
                            </span>
                          )}
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((member) => (
            <Badge
              key={member.id}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20 gap-1"
              onClick={() => removeMember(member.id)}
            >
              {member.name} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

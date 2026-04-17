import { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'team_member' | 'admin';
};

type UserClient = {
  id: string;
  user_id: string;
  client_id: string;
};

interface ClientAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function ClientAccessDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ClientAccessDialogProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<UserClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const [profilesRes, assignmentsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('full_name'),
      supabase
        .from('user_clients')
        .select('id, user_id, client_id')
        .eq('client_id', clientId),
    ]);

    if (!profilesRes.error) {
      setProfiles((profilesRes.data ?? []) as Profile[]);
    }
    if (!assignmentsRes.error) {
      setAssignments((assignmentsRes.data ?? []) as UserClient[]);
    }

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const isAssigned = (userId: string) =>
    assignments.some((a) => a.user_id === userId);

  const handleToggle = async (profile: Profile) => {
    setTogglingId(profile.id);
    const existing = assignments.find((a) => a.user_id === profile.id);

    if (existing) {
      // Remove assignment
      const { error } = await supabase
        .from('user_clients')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast.error('Impossible de retirer l\'accès');
      } else {
        setAssignments((prev) => prev.filter((a) => a.id !== existing.id));
        toast.success(`${profile.full_name} retiré(e) de ${clientName}`);
      }
    } else {
      // Add assignment
      const { data, error } = await (
        supabase as unknown as { from: (t: string) => Record<string, unknown> }
      )
        .from('user_clients')
        .insert({ user_id: profile.id, client_id: clientId })
        .select('id, user_id, client_id')
        .single();

      if (error) {
        toast.error('Impossible d\'ajouter l\'accès');
      } else if (data) {
        setAssignments((prev) => [...prev, data as UserClient]);
        toast.success(`${profile.full_name} ajouté(e) à ${clientName}`);
      }
    }

    setTogglingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Accès — {clientName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Sélectionnez les membres de l'équipe qui ont accès à ce client.
          Les admins ont toujours accès à tous les clients.
        </p>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun membre d'équipe trouvé.
          </p>
        ) : (
          <div className="divide-y divide-border max-h-[50vh] overflow-y-auto -mx-6 px-6">
            {profiles.map((p) => {
              const assigned = isAssigned(p.id);
              const isAdmin = p.role === 'admin';
              const toggling = togglingId === p.id;

              return (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {p.full_name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.email}
                      </p>
                    </div>
                  </div>

                  {isAdmin ? (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Admin (tous)
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant={assigned ? 'default' : 'outline'}
                      className="shrink-0 h-8 w-8 p-0"
                      disabled={toggling}
                      onClick={() => handleToggle(p)}
                      title={assigned ? 'Retirer l\'accès' : 'Donner l\'accès'}
                    >
                      {toggling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : assigned ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">+</span>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

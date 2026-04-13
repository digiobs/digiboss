import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Loader2, Shield, UserCog, Trash2, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'team_member' | 'admin';
  avatar_url: string | null;
  created_at: string;
};

export function TeamMembersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'team_member' | 'admin'>('team_member');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'invite' | 'password'>('invite');
  const [isSending, setIsSending] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to load profiles:', error.message);
    } else {
      setProfiles((data ?? []) as Profile[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    const name = inviteName.trim();
    if (!email) {
      toast.error('L\'email est requis');
      return;
    }
    if (!name) {
      toast.error('Le nom est requis');
      return;
    }

    const password = invitePassword.trim();
    if (inviteMethod === 'password' && (!password || password.length < 6)) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsSending(true);
    try {
      const body: Record<string, unknown> = {
        email,
        full_name: name,
        role: inviteRole,
        method: inviteMethod,
      };
      if (inviteMethod === 'password') {
        body.password = password;
      } else {
        body.redirect_to = `${window.location.origin}/reset-password`;
      }

      const { data, error } = await supabase.functions.invoke(
        'invite-team-member',
        { body },
      );
      if (error) throw error;
      const payload = data as { error?: string; user?: { id: string } };
      if (payload?.error) throw new Error(payload.error);

      toast.success(
        inviteMethod === 'invite'
          ? `Invitation envoyée à ${email}`
          : `${name} a été ajouté(e) à l'équipe`,
      );
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setInviteRole('team_member');
      setInviteMethod('invite');
      await fetchProfiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Impossible d'inviter : ${message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReset = async (targetEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Email de réinitialisation envoyé à ${targetEmail}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Envoi impossible : ${message}`);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: 'team_member' | 'admin') => {
    setUpdatingId(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      toast.error('Impossible de changer le rôle');
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p)),
      );
      toast.success('Rôle mis à jour');
    }
    setUpdatingId(null);
  };

  const handleDelete = async (profile: Profile) => {
    if (
      !confirm(
        `Supprimer ${profile.full_name} de l'équipe ? Cette action supprimera aussi son compte Supabase Auth.`,
      )
    ) {
      return;
    }

    setUpdatingId(profile.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        'invite-team-member',
        { body: { action: 'delete', userId: profile.id } },
      );
      if (error) throw error;
      const payload = data as { error?: string };
      if (payload?.error) throw new Error(payload.error);

      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      toast.success(`${profile.full_name} a été supprimé(e)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Suppression impossible : ${message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const roleBadge = (role: string) =>
    role === 'admin' ? (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">Membre</Badge>
    );

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Membres de l'équipe</h2>
            <Badge variant="secondary">{profiles.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Inviter
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucun membre d'équipe. Cliquez "Inviter" pour en ajouter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {p.full_name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {p.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {roleBadge(p.role)}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Envoyer un email de réinitialisation"
                      disabled={updatingId === p.id}
                      onClick={() => handleSendReset(p.email)}
                    >
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={
                        p.role === 'admin'
                          ? 'Rétrograder en membre'
                          : 'Promouvoir admin'
                      }
                      disabled={updatingId === p.id}
                      onClick={() =>
                        handleRoleChange(
                          p.id,
                          p.role === 'admin' ? 'team_member' : 'admin',
                        )
                      }
                    >
                      <UserCog className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Supprimer"
                      disabled={updatingId === p.id}
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Inviter un membre
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Tabs
              value={inviteMethod}
              onValueChange={(v) => setInviteMethod(v as 'invite' | 'password')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite">Email d'invitation</TabsTrigger>
                <TabsTrigger value="password">Mot de passe initial</TabsTrigger>
              </TabsList>
              <TabsContent value="invite" className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Un email sera envoyé avec un lien pour définir le mot de passe.
                </p>
              </TabsContent>
              <TabsContent value="password" className="pt-2 space-y-2">
                <Label htmlFor="invite-password">Mot de passe initial</Label>
                <Input
                  id="invite-password"
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                />
                <p className="text-xs text-muted-foreground">
                  Aucun email envoyé. Communiquez le mot de passe manuellement.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="invite-name">Nom complet</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="prenom@digiobs.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) =>
                  setInviteRole(v as 'team_member' | 'admin')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">Membre</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={isSending}>
              {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {inviteMethod === 'invite' ? 'Envoyer l\'invitation' : 'Créer le compte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

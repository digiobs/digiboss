import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Loader2,
  Shield,
  Trash2,
  Mail,
  KeyRound,
  Lock,
  Building2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
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
import { FunctionsHttpError } from '@supabase/supabase-js';

async function extractEdgeFunctionError(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const body = await err.context.json();
      if (body?.error) return String(body.error);
    } catch {
      // fallthrough
    }
  }
  return err instanceof Error ? err.message : 'Erreur inconnue';
}

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'team_member' | 'admin';
  avatar_url: string | null;
  created_at: string;
};

type ClientLite = { id: string; name: string };
type UserClient = { id: string; user_id: string; client_id: string };
type BusyKind = 'role' | 'reset' | 'password' | 'delete' | 'profile' | null;

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ProfileCard({
  profile,
  clients,
  assignments,
  onRoleChange,
  onSendReset,
  onSetPassword,
  onUpdateProfile,
  onDelete,
  onToggleClient,
}: {
  profile: Profile;
  clients: ClientLite[];
  assignments: UserClient[];
  onRoleChange: (role: 'team_member' | 'admin') => Promise<void>;
  onSendReset: () => Promise<void>;
  onSetPassword: (pwd: string) => Promise<void>;
  onUpdateProfile: (fullName: string, email: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onToggleClient: (clientId: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(profile.full_name);
  const [email, setEmail] = useState(profile.email);
  const [busy, setBusy] = useState<BusyKind>(null);
  const [showClients, setShowClients] = useState(false);
  const [togglingClientId, setTogglingClientId] = useState<string | null>(null);

  const userClientIds = new Set(
    assignments.filter((a) => a.user_id === profile.id).map((a) => a.client_id),
  );
  const assignedCount = userClientIds.size;

  useEffect(() => {
    setFullName(profile.full_name);
    setEmail(profile.email);
  }, [profile.full_name, profile.email]);

  const run = async (kind: Exclude<BusyKind, null>, fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const isBusy = busy !== null;
  const profileDirty =
    fullName.trim() !== profile.full_name || email.trim() !== profile.email;

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-4">
      {/* Header: avatar + editable name/email + delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">
              {initials(fullName || profile.full_name)}
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <Label
                htmlFor={`name-${profile.id}`}
                className="text-xs text-muted-foreground"
              >
                Nom complet
              </Label>
              <Input
                id={`name-${profile.id}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isBusy}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`email-${profile.id}`}
                className="text-xs text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id={`email-${profile.id}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBusy}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy || !profileDirty}
                onClick={() =>
                  run('profile', () =>
                    onUpdateProfile(fullName.trim(), email.trim()),
                  )
                }
              >
                {busy === 'profile' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
              {profileDirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isBusy}
                  onClick={() => {
                    setFullName(profile.full_name);
                    setEmail(profile.email);
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive shrink-0"
          disabled={isBusy}
          onClick={() => run('delete', onDelete)}
        >
          {busy === 'delete' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span className="ml-1.5">Supprimer</span>
        </Button>
      </div>

      {/* Fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Role */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Rôle
          </Label>
          <Select
            value={profile.role}
            disabled={isBusy}
            onValueChange={(v) =>
              run('role', () => onRoleChange(v as 'team_member' | 'admin'))
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

        {/* Reset email */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <KeyRound className="w-3 h-3" />
            Réinitialisation par email
          </Label>
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={() => run('reset', onSendReset)}
          >
            {busy === 'reset' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Envoyer l'email
          </Button>
        </div>

        {/* Direct password */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label
            htmlFor={`pwd-${profile.id}`}
            className="text-xs flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3" />
            Nouveau mot de passe (sans email)
          </Label>
          <div className="flex gap-2">
            <Input
              id={`pwd-${profile.id}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              disabled={isBusy}
            />
            <Button
              variant="secondary"
              disabled={isBusy || password.trim().length < 6}
              onClick={async () => {
                await run('password', () => onSetPassword(password.trim()));
                setPassword('');
              }}
            >
              {busy === 'password' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* Client access section */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
          onClick={() => setShowClients(!showClients)}
        >
          <Building2 className="w-4 h-4" />
          Accès clients
          {profile.role === 'admin' ? (
            <Badge variant="outline" className="text-[10px] h-4 ml-1">Admin (tous)</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] h-4 ml-1">
              {assignedCount}/{clients.length}
            </Badge>
          )}
          {showClients ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          )}
        </button>

        {showClients && (
          <div className="mt-2 space-y-1">
            {profile.role === 'admin' ? (
              <p className="text-xs text-muted-foreground italic py-1">
                Les administrateurs ont accès à tous les clients automatiquement.
              </p>
            ) : clients.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                Aucun client disponible.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {clients.map((client) => {
                  const assigned = userClientIds.has(client.id);
                  const toggling = togglingClientId === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      disabled={toggling || isBusy}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors text-left ${
                        assigned
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={async () => {
                        setTogglingClientId(client.id);
                        await onToggleClient(client.id);
                        setTogglingClientId(null);
                      }}
                    >
                      {toggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : assigned ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-muted-foreground/40 shrink-0" />
                      )}
                      <span className="truncate">{client.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamMembersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allClients, setAllClients] = useState<ClientLite[]>([]);
  const [allAssignments, setAllAssignments] = useState<UserClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'team_member' | 'admin'>(
    'team_member',
  );
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'invite' | 'password'>(
    'invite',
  );
  const [isSending, setIsSending] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    const [profilesRes, clientsRes, assignmentsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at')
        .order('created_at', { ascending: true }),
      supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name'),
      supabase.from('user_clients').select('id, user_id, client_id'),
    ]);

    if (!profilesRes.error) {
      setProfiles((profilesRes.data ?? []) as Profile[]);
    } else {
      console.warn('Failed to load profiles:', profilesRes.error.message);
    }
    if (!clientsRes.error) {
      setAllClients((clientsRes.data ?? []) as ClientLite[]);
    }
    if (!assignmentsRes.error) {
      setAllAssignments((assignmentsRes.data ?? []) as UserClient[]);
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
      toast.error("L'email est requis");
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
      const message = await extractEdgeFunctionError(err);
      toast.error(`Impossible d'inviter : ${message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleRoleChange = async (
    profileId: string,
    newRole: 'team_member' | 'admin',
  ) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      toast.error('Impossible de changer le rôle');
      return;
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p)),
    );
    toast.success('Rôle mis à jour');
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

  const handleUpdateProfile = async (
    profile: Profile,
    fullName: string,
    email: string,
  ) => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }
    if (!trimmedEmail) {
      toast.error("L'email ne peut pas être vide");
      return;
    }
    const nameChanged = trimmedName !== profile.full_name;
    const emailChanged = trimmedEmail !== profile.email;
    if (!nameChanged && !emailChanged) return;

    try {
      const body: Record<string, unknown> = {
        action: 'update_user',
        userId: profile.id,
      };
      if (nameChanged) body.full_name = trimmedName;
      if (emailChanged) body.email = trimmedEmail;

      const { data, error } = await supabase.functions.invoke(
        'invite-team-member',
        { body },
      );
      if (error) throw error;
      const payload = data as { error?: string };
      if (payload?.error) throw new Error(payload.error);

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...p, full_name: trimmedName, email: trimmedEmail }
            : p,
        ),
      );
      toast.success(`${trimmedName} a été mis à jour`);
    } catch (err) {
      const message = await extractEdgeFunctionError(err);
      toast.error(`Mise à jour impossible : ${message}`);
    }
  };

  const handleSetPassword = async (profile: Profile, pwd: string) => {
    if (pwd.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        'invite-team-member',
        {
          body: {
            action: 'set_password',
            userId: profile.id,
            password: pwd,
          },
        },
      );
      if (error) throw error;
      const payload = data as { error?: string };
      if (payload?.error) throw new Error(payload.error);

      toast.success(`Mot de passe mis à jour pour ${profile.full_name}`);
    } catch (err) {
      const message = await extractEdgeFunctionError(err);
      toast.error(`Mise à jour impossible : ${message}`);
    }
  };

  const handleToggleClient = async (userId: string, clientId: string) => {
    const existing = allAssignments.find(
      (a) => a.user_id === userId && a.client_id === clientId,
    );

    if (existing) {
      const { error } = await supabase
        .from('user_clients')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast.error("Impossible de retirer l'accès");
        return;
      }
      setAllAssignments((prev) => prev.filter((a) => a.id !== existing.id));
      const clientName =
        allClients.find((c) => c.id === clientId)?.name ?? clientId;
      toast.success(`Accès retiré pour ${clientName}`);
    } else {
      const { data, error } = await (
        supabase as unknown as { from: (t: string) => Record<string, unknown> }
      )
        .from('user_clients')
        .insert({ user_id: userId, client_id: clientId })
        .select('id, user_id, client_id')
        .single();

      if (error) {
        toast.error("Impossible d'ajouter l'accès");
        return;
      }
      if (data) {
        setAllAssignments((prev) => [...prev, data as UserClient]);
        const clientName =
          allClients.find((c) => c.id === clientId)?.name ?? clientId;
        toast.success(`Accès ajouté pour ${clientName}`);
      }
    }
  };

  const handleDelete = async (profile: Profile) => {
    if (
      !confirm(
        `Supprimer ${profile.full_name} de l'équipe ? Cette action supprimera aussi son compte Supabase Auth.`,
      )
    ) {
      return;
    }

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
      const message = await extractEdgeFunctionError(err);
      toast.error(`Suppression impossible : ${message}`);
    }
  };

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
          <div className="p-4 space-y-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                clients={allClients}
                assignments={allAssignments}
                onRoleChange={(role) => handleRoleChange(p.id, role)}
                onSendReset={() => handleSendReset(p.email)}
                onSetPassword={(pwd) => handleSetPassword(p, pwd)}
                onUpdateProfile={(name, email) =>
                  handleUpdateProfile(p, name, email)
                }
                onDelete={() => handleDelete(p)}
                onToggleClient={(clientId) =>
                  handleToggleClient(p.id, clientId)
                }
              />
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
              {inviteMethod === 'invite'
                ? "Envoyer l'invitation"
                : 'Créer le compte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

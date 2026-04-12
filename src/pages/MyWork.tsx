import { useState } from 'react';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Briefcase, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Phase 1 placeholder for the team-member "My Work" dashboard.
 * Phase 2 will add the real ProductionKanban filtered by assignee_id.
 */
export default function MyWork() {
  const { profile, signOut } = useTeamAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsChanging(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(`Erreur : ${error.message}`);
    } else {
      toast.success('Mot de passe mis à jour');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsChanging(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mon travail</h1>
          <p className="text-muted-foreground">
            Bienvenue, {profile?.full_name ?? 'collaborateur'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm font-medium">Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {profile?.role === 'admin' ? 'Administrateur' : 'Membre équipe'}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm font-medium">Tâches assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Le tableau de bord de production arrive en phase 2.
              Les tâches qui vous seront assignées apparaîtront ici sous forme de kanban.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Password change */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Lock className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm font-medium">Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3 max-w-sm">
            <div className="space-y-1">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirmer</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
              />
            </div>
            <Button type="submit" size="sm" className="w-fit" disabled={isChanging}>
              {isChanging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mettre à jour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

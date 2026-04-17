import { useState } from 'react';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Loader2, Eye, EyeOff, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettings() {
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
          <h1 className="text-2xl font-bold">Paramètres du profil</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
        {profile && (
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        )}
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <User className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm font-medium">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {profile?.full_name
                  ?.split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold">{profile?.full_name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{profile?.email ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {profile?.role === 'admin' ? 'Administrateur' : 'Membre équipe'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

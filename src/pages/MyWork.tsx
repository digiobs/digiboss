import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User, Briefcase } from 'lucide-react';

/**
 * Phase 1 placeholder for the team-member "My Work" dashboard.
 * Phase 2 will add the real ProductionKanban filtered by assignee_id.
 */
export default function MyWork() {
  const { profile, signOut } = useTeamAuth();

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
    </div>
  );
}

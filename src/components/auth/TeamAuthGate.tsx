import { Navigate } from 'react-router-dom';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Route guard for admin-side pages that require a real Supabase team
 * member account. Redirects to /auth if the user is not authenticated.
 *
 * Client-facing routes continue to use PreAuthGuard and are unaffected.
 */
export function TeamAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isTeamMember } = useTeamAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isTeamMember) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

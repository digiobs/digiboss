import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CallbackState =
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export default function WrikeCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<CallbackState>({ kind: 'loading' });
  const hasRunRef = useRef(false);

  useEffect(() => {
    // React StrictMode fires effects twice in dev — guard so the state
    // token isn't consumed twice (second call would fail).
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const code = params.get('code');
    const stateToken = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      setState({
        kind: 'error',
        message: params.get('error_description') ?? errorParam,
      });
      return;
    }
    if (!code || !stateToken) {
      setState({ kind: 'error', message: 'Paramètres OAuth manquants' });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('wrike-oauth-callback', {
          body: { code, state: stateToken },
        });
        if (error) throw error;
        const result = data as { status?: string; error?: string };
        if (result?.status === 'ok') {
          setState({ kind: 'success' });
          toast.success('Wrike connecté avec succès');
          // Auto-redirect after a short pause so the user sees the success state.
          setTimeout(() => navigate('/settings/integrations', { replace: true }), 1500);
        } else {
          setState({ kind: 'error', message: result?.error ?? 'Réponse inattendue' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setState({ kind: 'error', message });
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {state.kind === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
              <h1 className="text-lg font-semibold">Connexion à Wrike en cours…</h1>
              <p className="text-sm text-muted-foreground">
                Échange du code d'autorisation, merci de patienter.
              </p>
            </>
          )}
          {state.kind === 'success' && (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h1 className="text-lg font-semibold">Wrike connecté</h1>
              <p className="text-sm text-muted-foreground">
                Redirection vers les paramètres d'intégration…
              </p>
            </>
          )}
          {state.kind === 'error' && (
            <>
              <XCircle className="w-10 h-10 mx-auto text-red-500" />
              <h1 className="text-lg font-semibold">Connexion échouée</h1>
              <p className="text-sm text-muted-foreground break-words">{state.message}</p>
              <Button
                variant="outline"
                onClick={() => navigate('/settings/integrations', { replace: true })}
              >
                Retour aux intégrations
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

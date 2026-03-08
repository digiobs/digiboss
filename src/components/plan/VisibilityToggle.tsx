import { Button } from '@/components/ui/button';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisibilityMode } from '@/hooks/useVisibilityMode';

interface VisibilityToggleProps {
  mode: VisibilityMode;
  onToggle: () => void;
}

export function VisibilityToggle({ mode, onToggle }: VisibilityToggleProps) {
  const isAdmin = mode === 'admin';

  return (
    <Button
      variant={isAdmin ? 'default' : 'outline'}
      size="sm"
      onClick={onToggle}
      className={cn(
        'gap-2 transition-all',
        isAdmin
          ? 'bg-primary text-primary-foreground'
          : 'border-warning text-warning hover:bg-warning/10'
      )}
    >
      {isAdmin ? (
        <>
          <Unlock className="w-3.5 h-3.5" />
          Vue Interne
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5" />
          Vue Partageable
        </>
      )}
    </Button>
  );
}

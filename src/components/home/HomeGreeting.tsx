import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClient } from '@/contexts/ClientContext';

export function HomeGreeting() {
  const { clients } = useClient();
  const hour = new Date().getHours();
  const name = 'DigiObs';

  let greeting: string;
  if (hour >= 6 && hour < 12) greeting = `Bonjour, ${name} 👋`;
  else if (hour >= 12 && hour < 18) greeting = `Bon après-midi, ${name}`;
  else greeting = `Bonsoir, ${name}`;

  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">
          {dayName} {dateStr} — {clients.length} clients actifs
        </p>
      </div>
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">DO</AvatarFallback>
      </Avatar>
    </div>
  );
}

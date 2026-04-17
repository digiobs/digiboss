import { Fragment } from 'react';
import { ArrowRight, Bot, CheckCircle2, Rocket, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Step = {
  icon: typeof Bot;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
};

const STEPS: Step[] = [
  {
    icon: Bot,
    title: 'En attente',
    description:
      'Nos IA analysent vos données et proposent des idées de contenus à votre équipe.',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  {
    icon: CheckCircle2,
    title: 'Validées',
    description:
      "L'équipe DigiObs retient les meilleures idées et démarre la production (une tâche est créée dans Wrike).",
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  },
  {
    icon: Rocket,
    title: 'À publier',
    description:
      'Les contenus sont rédigés, relus et prêts à être publiés sur vos canaux.',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
  },
  {
    icon: Send,
    title: 'Publiées',
    description: 'Le contenu est en ligne et visible par votre audience.',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass:
      'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800',
  },
];

export function WorkflowLegend() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Comment fonctionne la production de vos contenus
          </h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-stretch gap-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <Fragment key={step.title}>
                <div
                  className={cn(
                    'flex-1 rounded-lg border p-3 flex flex-col',
                    step.bgClass,
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('w-4 h-4 shrink-0', step.colorClass)} />
                    <p className={cn('text-sm font-semibold', step.colorClass)}>
                      {idx + 1}. {step.title}
                    </p>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!isLast && (
                  <div className="hidden md:flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default WorkflowLegend;

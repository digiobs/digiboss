import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  FileText,
  Pencil,
  Eye,
  Calendar,
  CheckCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
}

interface PipelineColumn {
  id: string;
  label: string;
  icon: typeof FileText;
  items: ContentItem[];
  className: string;
}

const pipelineColumns: PipelineColumn[] = [
  {
    id: 'idea',
    label: 'Idea',
    icon: Lightbulb,
    className: 'bg-slate-100 dark:bg-slate-800',
    items: [
      { id: '1', title: 'AI trends roundup', type: 'blog' },
      { id: '2', title: 'Customer success story', type: 'testimonial' },
    ],
  },
  {
    id: 'draft',
    label: 'Draft',
    icon: Pencil,
    className: 'bg-blue-50 dark:bg-blue-900/20',
    items: [
      { id: '3', title: 'SEO optimization guide', type: 'blog' },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    icon: Eye,
    className: 'bg-amber-50 dark:bg-amber-900/20',
    items: [
      { id: '4', title: 'Product webinar invite', type: 'email' },
    ],
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: Calendar,
    className: 'bg-purple-50 dark:bg-purple-900/20',
    items: [
      { id: '5', title: 'LinkedIn: Industry insights', type: 'social' },
    ],
  },
  {
    id: 'published',
    label: 'Published',
    icon: CheckCircle,
    className: 'bg-emerald-50 dark:bg-emerald-900/20',
    items: [
      { id: '6', title: 'B2B Marketing Playbook', type: 'ebook' },
    ],
  },
];

interface ContentPipelinePanelProps {
  isEmpty?: boolean;
}

export function ContentPipelinePanel({ isEmpty = false }: ContentPipelinePanelProps) {
  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Content pipeline</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Pencil className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm mb-1">No content in production</h4>
          <p className="text-xs text-muted-foreground mb-4 max-w-[220px] mx-auto">
            Start from an opportunity: generate a draft from Next Best Actions.
          </p>
          <Button variant="outline" size="sm" className="text-xs">
            Create content
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Content pipeline</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">From idea to published.</p>

      {/* Mini Kanban */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {pipelineColumns.map((column) => {
          const Icon = column.icon;
          return (
            <div key={column.id} className="flex-1 min-w-[100px]">
              <div className="flex items-center gap-1 mb-2">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {column.label}
                </span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">
                  {column.items.length}
                </Badge>
              </div>
              <div className={cn('rounded-lg p-2 space-y-1.5', column.className)}>
                {column.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded p-2 text-[11px] font-medium border border-border/50 hover:border-primary/30 transition-colors cursor-pointer line-clamp-2"
                  >
                    {item.title}
                  </div>
                ))}
                {column.items.length === 0 && (
                  <div className="h-10 flex items-center justify-center text-[10px] text-muted-foreground">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <Link
        to="/content"
        className="mt-4 flex items-center justify-center gap-1 text-xs text-primary hover:underline"
      >
        Open Content Creator
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

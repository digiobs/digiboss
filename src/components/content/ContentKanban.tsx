import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Calendar,
  User,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  ContentItem, 
  ContentStatus, 
  contentTypeLabels,
  funnelStageLabels 
} from '@/types/content';
import { contentStatusColumns } from '@/data/contentData';

interface ContentKanbanProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onStatusChange: (itemId: string, newStatus: ContentStatus) => void;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

interface ContentCardProps {
  item: ContentItem;
  onClick: () => void;
  onEdit?: () => void;
  isDragging?: boolean;
}

function ContentCard({ item, onClick, onEdit, isDragging }: ContentCardProps) {
  const Icon = contentTypeIcons[item.contentType] || FileText;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md hover:border-primary/20 transition-all",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  (onEdit ?? onClick)();
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-[10px]">
            {contentTypeLabels[item.contentType]}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {funnelStageLabels[item.funnelStage]}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {item.owner ? (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{item.owner}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/60">Unassigned</span>
          )}
          {(item.dueDate || item.scheduledDate) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {format(new Date(item.scheduledDate || item.dueDate!), 'MMM d')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContentCard item={item} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

interface KanbanColumnProps {
  id: ContentStatus;
  title: string;
  color: string;
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

function KanbanColumn({ id, title, color, items, onItemClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="space-y-3 min-w-[280px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {items.length}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          `${color} rounded-lg p-2 min-h-[400px] space-y-2 transition-all`,
          isOver && "ring-2 ring-primary/50 ring-dashed"
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <DraggableContentCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

export function ContentKanban({ items, onItemClick, onStatusChange }: ContentKanbanProps) {
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getItemsByStatus = (status: ContentStatus) => 
    items.filter((i) => i.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = items.find((i) => i.id === activeId);
    if (!activeItem) return;

    // Check if dropping over a column
    const isOverColumn = contentStatusColumns.some((col) => col.id === overId);
    if (isOverColumn) {
      const newStatus = overId as ContentStatus;
      if (activeItem.status !== newStatus) {
        onStatusChange(activeId, newStatus);
      }
      return;
    }

    // Check if dropping over another item
    const overItem = items.find((i) => i.id === overId);
    if (overItem && activeItem.status !== overItem.status) {
      onStatusChange(activeId, overItem.status);
    }
  };

  const handleDragEnd = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {contentStatusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            items={getItemsByStatus(column.id)}
            onItemClick={onItemClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            <ContentCard item={activeItem} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

import { useState } from 'react';
import { Task, Project } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Flag, MessageSquare, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useComments } from '@/hooks/useComments';
import TaskCommentsModal from './TaskCommentsModal';

interface TaskCardProps {
  task: Task;
  project?: Project;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors = {
  low: 'bg-priority-low/10 text-priority-low border-priority-low/20',
  medium: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
  high: 'bg-priority-high/10 text-priority-high border-priority-high/20',
  urgent: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
};

const statusColors = {
  todo: 'bg-status-todo/10 text-status-todo',
  in_progress: 'bg-status-in-progress/10 text-status-in-progress',
  done: 'bg-status-done/10 text-status-done',
};

function formatDueDate(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export default function TaskCard({
  task,
  project,
  selected,
  onSelect,
  onComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { comments } = useComments(task.id);
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-soft',
        selected && 'ring-2 ring-primary ring-offset-2',
        isDone && 'opacity-60'
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onSelect}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 
              className={cn(
                'font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors',
                isDone && 'line-through text-muted-foreground'
              )}
              onClick={onEdit}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {task.status !== 'done' && (
                <DropdownMenuItem onClick={onComplete}>
                  <Checkbox className="mr-2 h-4 w-4" />
                  Mark complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
            <Flag className="mr-1 h-3 w-3" />
            {task.priority}
          </Badge>
          
          <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
            {task.status.replace('_', ' ')}
          </Badge>
          
          {task.due_date && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                isOverdue && 'bg-destructive/10 text-destructive border-destructive/20'
              )}
            >
              <Calendar className="mr-1 h-3 w-3" />
              {formatDueDate(task.due_date)}
            </Badge>
          )}
          
          {project && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                backgroundColor: `${project.color}15`,
                borderColor: `${project.color}30`,
                color: project.color 
              }}
            >
              {project.name}
            </Badge>
          )}

          {task.assigned_to && (
            <Badge variant="outline" className="text-xs">
              <User className="mr-1 h-3 w-3" />
              {task.assigned_to}
            </Badge>
          )}
          
          {task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{task.tags.length - 2}
            </Badge>
          )}

          {/* Comment count link */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCommentsOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {comments.length > 0 ? `${comments.length}` : 'Add comment'}
          </button>
        </div>
      </div>

      <TaskCommentsModal
        task={task}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}

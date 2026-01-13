import { useMemo, useState } from 'react';
import { Task, Project, TaskStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Flag, GripVertical, MessageSquare, User } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskEditModal from './TaskEditModal';
import TaskCommentsModal from './TaskCommentsModal';
import { useComments } from '@/hooks/useComments';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (task: Partial<Task> & { id: string }) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onMarkComplete: (id: string) => void;
}

const statusConfig: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-status-todo' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-status-in-progress' },
  { status: 'done', label: 'Done', color: 'bg-status-done' },
];

const priorityColors = {
  low: 'border-l-priority-low',
  medium: 'border-l-priority-medium',
  high: 'border-l-priority-high',
  urgent: 'border-l-priority-urgent',
};

function KanbanCard({ 
  task, 
  project, 
  onEdit,
  onOpenComments,
  commentCount,
}: { 
  task: Task; 
  project?: Project;
  onEdit: () => void;
  onOpenComments: () => void;
  commentCount: number;
}) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';

  return (
    <Card 
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-all border-l-4',
        priorityColors[task.priority],
        task.status === 'done' && 'opacity-60'
      )}
      onClick={onEdit}
    >
      <div className="space-y-2">
        <h4 className={cn(
          'font-medium text-sm line-clamp-2',
          task.status === 'done' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-1.5">
          {task.due_date && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px] px-1.5 py-0',
                isOverdue && 'bg-destructive/10 text-destructive border-destructive/20'
              )}
            >
              <Calendar className="mr-1 h-2.5 w-2.5" />
              {format(parseISO(task.due_date), 'MMM d')}
            </Badge>
          )}
          
          {project && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0"
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
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <User className="mr-1 h-2.5 w-2.5" />
              {task.assigned_to}
            </Badge>
          )}
        </div>

        {commentCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            {commentCount} comment{commentCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    </Card>
  );
}

function KanbanCardWithComments({ 
  task, 
  project, 
  onEdit,
  onOpenComments,
}: { 
  task: Task; 
  project?: Project;
  onEdit: () => void;
  onOpenComments: () => void;
}) {
  const { comments } = useComments(task.id);
  
  return (
    <KanbanCard 
      task={task} 
      project={project} 
      onEdit={onEdit}
      onOpenComments={onOpenComments}
      commentCount={comments.length}
    />
  );
}

export default function KanbanBoard({
  tasks,
  projects,
  onUpdateTask,
  onDeleteTask,
  onMarkComplete,
}: KanbanBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commentsTask, setCommentsTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const projectMap = useMemo(() => 
    new Map(projects.map((p) => [p.id, p])), 
    [projects]
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach(task => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      const updates: Partial<Task> & { id: string } = { 
        id: draggedTask.id, 
        status: newStatus 
      };
      if (newStatus === 'done') {
        updates.completed_at = new Date().toISOString();
      } else if (draggedTask.status === 'done') {
        updates.completed_at = null;
      }
      await onUpdateTask(updates);
    }
    setDraggedTask(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusConfig.map(({ status, label, color }) => (
        <div 
          key={status}
          className="flex-1 min-w-[280px] max-w-[350px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <h3 className="font-medium text-sm">{label}</h3>
            <Badge variant="secondary" className="text-xs ml-auto">
              {tasksByStatus[status].length}
            </Badge>
          </div>
          
          <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
            {tasksByStatus[status].map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className="cursor-grab active:cursor-grabbing"
              >
                <KanbanCardWithComments
                  task={task}
                  project={task.project_id ? projectMap.get(task.project_id) : undefined}
                  onEdit={() => setEditingTask(task)}
                  onOpenComments={() => setCommentsTask(task)}
                />
              </div>
            ))}
            {tasksByStatus[status].length === 0 && (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}

      <TaskEditModal
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={onUpdateTask}
        projects={projects}
      />

      <TaskCommentsModal
        task={commentsTask}
        open={!!commentsTask}
        onClose={() => setCommentsTask(null)}
      />
    </div>
  );
}
import { useMemo, useState } from 'react';
import { Task, TaskFilters, Project, SavedView, TaskPriority } from '@/lib/types';
import TaskCard from './TaskCard';
import TaskFiltersComponent from './TaskFilters';
import BulkActions from './BulkActions';
import TaskEditModal from './TaskEditModal';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  savedViews: SavedView[];
  isLoading: boolean;
  onUpdateTask: (task: Partial<Task> & { id: string }) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onDeleteTasks: (ids: string[]) => void;
  onUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  onMarkComplete: (id: string) => void;
  onSaveView: (name: string, filters: TaskFilters, sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
}

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

export default function TaskList({
  tasks,
  projects,
  savedViews,
  isLoading,
  onUpdateTask,
  onDeleteTask,
  onDeleteTasks,
  onUpdateTasks,
  onMarkComplete,
  onSaveView,
  onLoadView,
  onDeleteView,
}: TaskListProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }
    if (filters.status?.length) {
      result = result.filter((t) => filters.status!.includes(t.status));
    }
    if (filters.priority?.length) {
      result = result.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters.project_id) {
      result = result.filter((t) => t.project_id === filters.project_id);
    }
    if (filters.due_date_from) {
      result = result.filter((t) => t.due_date && t.due_date >= filters.due_date_from!);
    }
    if (filters.due_date_to) {
      result = result.filter((t) => t.due_date && t.due_date <= filters.due_date_to!);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'priority':
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'due_date':
          aVal = a.due_date || '';
          bVal = b.due_date || '';
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          aVal = a[sortBy as keyof Task] || '';
          bVal = b[sortBy as keyof Task] || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, filters, sortBy, sortOrder]);

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkMarkDone = () => {
    onUpdateTasks(Array.from(selectedIds), { 
      status: 'done', 
      completed_at: new Date().toISOString() 
    });
    setSelectedIds(new Set());
  };

  const handleBulkChangePriority = (priority: TaskPriority) => {
    onUpdateTasks(Array.from(selectedIds), { priority });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} tasks?`)) {
      onDeleteTasks(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleLoadView = (view: SavedView) => {
    setFilters(view.filters);
    setSortBy(view.sort_by);
    setSortOrder(view.sort_order);
    onLoadView(view);
  };

  const projectMap = useMemo(() => 
    new Map(projects.map((p) => [p.id, p])), 
    [projects]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TaskFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
        }}
        projects={projects}
        savedViews={savedViews}
        onSaveView={(name) => onSaveView(name, filters, sortBy, sortOrder)}
        onLoadView={handleLoadView}
        onDeleteView={onDeleteView}
      />

      <BulkActions
        selectedCount={selectedIds.size}
        onMarkDone={handleBulkMarkDone}
        onChangePriority={handleBulkChangePriority}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length === 0 
              ? 'Add your first task to get started' 
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={task.project_id ? projectMap.get(task.project_id) : undefined}
              selected={selectedIds.has(task.id)}
              onSelect={(selected) => handleSelect(task.id, selected)}
              onComplete={() => onMarkComplete(task.id)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => {
                if (confirm('Delete this task?')) {
                  onDeleteTask(task.id);
                }
              }}
            />
          ))}
        </div>
      )}

      <TaskEditModal
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={onUpdateTask}
        projects={projects}
      />
    </div>
  );
}

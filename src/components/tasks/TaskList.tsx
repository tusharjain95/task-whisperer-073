import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, TaskFilters, Project, SavedView, TaskPriority, TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';
import TaskFiltersComponent from './TaskFilters';
import BulkActions from './BulkActions';
import TaskEditModal from './TaskEditModal';
import KanbanBoard from './KanbanBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ListTodo, LayoutGrid, List } from 'lucide-react';
import { isToday, isPast, isThisWeek, parseISO, format } from 'date-fns';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Handle URL-based filters from dashboard
  useEffect(() => {
    const filterType = searchParams.get('filter');
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const assigneeParam = searchParams.get('assignee');

    if (filterType) {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (filterType === 'overdue') {
        setFilters({ due_date_to: today, status: ['todo', 'in_progress'] });
      } else if (filterType === 'today') {
        setFilters({ due_date_from: today, due_date_to: today, status: ['todo', 'in_progress'] });
      } else if (filterType === 'week') {
        setFilters({ status: ['todo', 'in_progress'] });
        setSortBy('due_date');
        setSortOrder('asc');
      } else if (filterType === 'done') {
        setFilters({ status: ['done'] });
      }
      // Clear the URL params after applying
      setSearchParams({});
    }

    if (statusParam) {
      setFilters({ status: [statusParam as TaskStatus] });
      setSearchParams({});
    }

    if (priorityParam) {
      setFilters({ priority: [priorityParam as TaskPriority] });
      setSearchParams({});
    }

    if (assigneeParam) {
      setFilters({ assigned_to: assigneeParam === 'Unassigned' ? undefined : assigneeParam });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
    if (filters.assigned_to) {
      result = result.filter((t) => t.assigned_to === filters.assigned_to);
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

  const handleBulkAssignProject = (projectId: string | null) => {
    onUpdateTasks(Array.from(selectedIds), { project_id: projectId });
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

  // Get unique assignees from tasks
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set<string>();
    tasks.forEach(t => {
      if (t.assigned_to) uniqueAssignees.add(t.assigned_to);
    });
    return Array.from(uniqueAssignees).sort();
  }, [tasks]);

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
      <div className="flex items-center gap-2">
        <div className="flex-1">
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
            assignees={assignees}
          />
        </div>
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Kanban
          </Button>
        </div>
      </div>

      <BulkActions
        selectedCount={selectedIds.size}
        projects={projects}
        onMarkDone={handleBulkMarkDone}
        onChangePriority={handleBulkChangePriority}
        onAssignProject={handleBulkAssignProject}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          projects={projects}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onMarkComplete={onMarkComplete}
        />
      ) : filteredTasks.length === 0 ? (
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

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useSavedViews } from '@/hooks/useSavedViews';
import AppLayout from '@/components/layout/AppLayout';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import TaskList from '@/components/tasks/TaskList';
import { toast } from 'sonner';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { tasks, isLoading, updateTask, deleteTask, deleteTasks, updateTasks, markComplete } = useTasks();
  const { projects } = useProjects();
  const { views, createView, deleteView } = useSavedViews();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleSaveView = async (name: string, filters: any, sortBy: string, sortOrder: 'asc' | 'desc') => {
    try {
      await createView.mutateAsync({ name, filters, sort_by: sortBy, sort_order: sortOrder });
      toast.success('View saved');
    } catch {
      toast.error('Failed to save view');
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and stay productive</p>
        </div>
        
        <QuickAddTask />
        
        <TaskList
          tasks={tasks}
          projects={projects}
          savedViews={views}
          isLoading={isLoading}
          onUpdateTask={async (task) => {
            await updateTask.mutateAsync(task);
            toast.success('Task updated');
          }}
          onDeleteTask={(id) => {
            deleteTask.mutate(id);
            toast.success('Task deleted');
          }}
          onDeleteTasks={(ids) => {
            deleteTasks.mutate(ids);
            toast.success(`${ids.length} tasks deleted`);
          }}
          onUpdateTasks={(ids, updates) => {
            updateTasks.mutate({ ids, updates });
            toast.success(`${ids.length} tasks updated`);
          }}
          onMarkComplete={(id) => {
            markComplete(id);
            toast.success('Task completed');
          }}
          onSaveView={handleSaveView}
          onLoadView={() => {}}
          onDeleteView={(id) => {
            deleteView.mutate(id);
            toast.success('View deleted');
          }}
        />
      </div>
    </AppLayout>
  );
}

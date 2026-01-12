import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isToday, isPast, isThisWeek, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Calendar, CheckCircle2, Clock, ListTodo, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();

  if (!loading && !user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const stats = useMemo(() => {
    const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done');
    const dueToday = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done');
    const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(parseISO(t.due_date)) && t.status !== 'done');
    
    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
    
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
      high: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
      medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length,
      low: tasks.filter(t => t.priority === 'low' && t.status !== 'done').length,
    };

    // Group by assignee
    const byAssignee: { [key: string]: { total: number; pending: number; done: number } } = {};
    tasks.forEach(t => {
      const assignee = t.assigned_to || 'Unassigned';
      if (!byAssignee[assignee]) {
        byAssignee[assignee] = { total: 0, pending: 0, done: 0 };
      }
      byAssignee[assignee].total++;
      if (t.status === 'done') {
        byAssignee[assignee].done++;
      } else {
        byAssignee[assignee].pending++;
      }
    });

    return { overdue, dueToday, dueThisWeek, byStatus, byPriority, byAssignee, total: tasks.length };
  }, [tasks]);

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your tasks and productivity</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
            onClick={() => navigate('/?filter=overdue')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdue.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/?filter=today')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dueToday.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/?filter=week')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dueThisWeek.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view</p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-status-done/5 border-status-done/20 cursor-pointer hover:bg-status-done/10 transition-colors"
            onClick={() => navigate('/?filter=done')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-done" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-done">{stats.byStatus.done}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'To Do', value: stats.byStatus.todo, color: 'bg-status-todo', filter: 'todo' },
                { label: 'In Progress', value: stats.byStatus.in_progress, color: 'bg-status-in-progress', filter: 'in_progress' },
                { label: 'Done', value: stats.byStatus.done, color: 'bg-status-done', filter: 'done' },
              ].map(({ label, value, color, filter }) => (
                <div 
                  key={label} 
                  className="flex items-center gap-3 p-2 -mx-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/?status=${filter}`)}
                >
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="flex-1 text-sm">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tasks by Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Urgent', value: stats.byPriority.urgent, color: 'bg-priority-urgent', filter: 'urgent' },
                { label: 'High', value: stats.byPriority.high, color: 'bg-priority-high', filter: 'high' },
                { label: 'Medium', value: stats.byPriority.medium, color: 'bg-priority-medium', filter: 'medium' },
                { label: 'Low', value: stats.byPriority.low, color: 'bg-priority-low', filter: 'low' },
              ].map(({ label, value, color, filter }) => (
                <div 
                  key={label} 
                  className="flex items-center gap-3 p-2 -mx-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/?priority=${filter}`)}
                >
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="flex-1 text-sm">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tasks by Assignee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {Object.entries(stats.byAssignee)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([assignee, data]) => (
                    <div 
                      key={assignee} 
                      className="flex items-center gap-3 p-2 -mx-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/?assignee=${encodeURIComponent(assignee)}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                        {assignee.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{assignee}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.pending} pending · {data.done} done
                        </p>
                      </div>
                      <span className="font-medium text-sm">{data.total}</span>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

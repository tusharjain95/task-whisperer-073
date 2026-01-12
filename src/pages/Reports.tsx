import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileJson } from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function Reports() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Get unique assignees
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set<string>();
    tasks.forEach(t => {
      if (t.assigned_to) uniqueAssignees.add(t.assigned_to);
    });
    return Array.from(uniqueAssignees).sort();
  }, [tasks]);

  if (!loading && !user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = parseISO(task.created_at);
      const inRange = isWithinInterval(taskDate, { start: dateRange.from, end: dateRange.to });
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter;
      return inRange && matchesStatus && matchesAssignee;
    });
  }, [tasks, dateRange, statusFilter, assigneeFilter]);

  const exportCSV = () => {
    const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Project', 'Assigned To', 'Created', 'Completed'];
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    const rows = filteredTasks.map(t => [
      t.title,
      t.status,
      t.priority,
      t.due_date || '',
      t.project_id ? projectMap.get(t.project_id) || '' : '',
      t.assigned_to || '',
      format(parseISO(t.created_at), 'yyyy-MM-dd'),
      t.completed_at ? format(parseISO(t.completed_at), 'yyyy-MM-dd') : '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report downloaded');
  };

  const exportJSON = () => {
    const data = { tasks, projects, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    toast.success('Data exported');
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Export and analyze your task data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                />
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredTasks.length} tasks</p>
            <p className="text-muted-foreground text-sm">matching your filters</p>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={exportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportJSON} className="gap-2">
                <FileJson className="h-4 w-4" />
                Export All Data (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

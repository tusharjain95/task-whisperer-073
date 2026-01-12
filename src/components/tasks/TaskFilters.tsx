import { TaskFilters as Filters, TaskStatus, TaskPriority, Project, SavedView } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, CalendarIcon, Save, Bookmark, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  projects: Project[];
  savedViews: SavedView[];
  onSaveView: (name: string) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  assignees: string[];
}

const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function TaskFilters({
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onSortChange,
  projects,
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView,
  assignees,
}: TaskFiltersProps) {
  const activeFilterCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.project_id,
    filters.due_date_from,
    filters.due_date_to,
    filters.assigned_to,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({ search: filters.search });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks..."
            className="pl-10 bg-card"
          />
        </div>

        {/* Sort */}
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('-');
            onSortChange(newSortBy, newSortOrder as 'asc' | 'desc');
          }}
        >
          <SelectTrigger className="w-full sm:w-48 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest first</SelectItem>
            <SelectItem value="created_at-asc">Oldest first</SelectItem>
            <SelectItem value="due_date-asc">Due date (soonest)</SelectItem>
            <SelectItem value="due_date-desc">Due date (latest)</SelectItem>
            <SelectItem value="priority-desc">Priority (high to low)</SelectItem>
            <SelectItem value="priority-asc">Priority (low to high)</SelectItem>
            <SelectItem value="title-asc">Title (A-Z)</SelectItem>
            <SelectItem value="updated_at-desc">Recently updated</SelectItem>
          </SelectContent>
        </Select>

        {/* Saved Views */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Views</span>
              {savedViews.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedViews.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="font-medium text-sm">Saved Views</div>
              {savedViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved views yet</p>
              ) : (
                <div className="space-y-1">
                  {savedViews.map((view) => (
                    <div key={view.id} className="flex items-center justify-between">
                      <button
                        onClick={() => onLoadView(view)}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {view.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDeleteView(view.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    const name = prompt('Enter view name:');
                    if (name) onSaveView(name);
                  }}
                >
                  <Save className="h-3 w-3" />
                  Save current view
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1',
                filters.status?.length && 'bg-primary/10 border-primary/30'
              )}
            >
              Status
              {filters.status?.length && (
                <Badge variant="secondary" className="ml-1 px-1.5">{filters.status.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              {statuses.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const newStatuses = e.target.checked
                        ? [...(filters.status || []), status]
                        : filters.status?.filter((s) => s !== status) || [];
                      onFiltersChange({ ...filters, status: newStatuses.length ? newStatuses : undefined });
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1',
                filters.priority?.length && 'bg-primary/10 border-primary/30'
              )}
            >
              Priority
              {filters.priority?.length && (
                <Badge variant="secondary" className="ml-1 px-1.5">{filters.priority.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              {priorities.map((priority) => (
                <label key={priority} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(priority) || false}
                    onChange={(e) => {
                      const newPriorities = e.target.checked
                        ? [...(filters.priority || []), priority]
                        : filters.priority?.filter((p) => p !== priority) || [];
                      onFiltersChange({ ...filters, priority: newPriorities.length ? newPriorities : undefined });
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Project Filter */}
        <Select
          value={filters.project_id || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, project_id: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className={cn(
            'w-36 h-8 text-sm',
            filters.project_id && 'bg-primary/10 border-primary/30'
          )}>
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Due Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1',
                (filters.due_date_from || filters.due_date_to) && 'bg-primary/10 border-primary/30'
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              Due date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.due_date_from ? new Date(filters.due_date_from) : undefined,
                to: filters.due_date_to ? new Date(filters.due_date_to) : undefined,
              }}
              onSelect={(range) => {
                onFiltersChange({
                  ...filters,
                  due_date_from: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                  due_date_to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                });
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Assignee Filter */}
        <Select
          value={filters.assigned_to || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, assigned_to: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className={cn(
            'w-36 h-8 text-sm',
            filters.assigned_to && 'bg-primary/10 border-primary/30'
          )}>
            <User className="h-3 w-3 mr-1" />
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

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

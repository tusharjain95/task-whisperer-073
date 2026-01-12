import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Loader2, Calendar as CalendarIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { TaskPriority, TaskStatus, Project } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QuickAddTaskProps {
  projects: Project[];
}

export default function QuickAddTask({ projects }: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { createTask } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAdding(true);
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        project_id: projectId,
        tags,
        assigned_to: assignedTo.trim() || null,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate(undefined);
      setProjectId(null);
      setTags([]);
      setAssignedTo('');
      setIsExpanded(false);
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 space-y-4 animate-fade-in">
      {/* Title row with expand toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="pl-10 h-11 bg-secondary/50"
            disabled={isAdding}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button type="submit" disabled={!title.trim() || isAdding} className="h-11 px-6">
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
      </div>

      {/* Expanded options */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Description */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="bg-secondary/50 min-h-[80px]"
            disabled={isAdding}
          />

          {/* Status, Priority, Due Date, Project, Assigned To */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "bg-secondary/50 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'MMM d') : 'Due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? null : v)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(project => (
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

            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Assigned to..."
              className="bg-secondary/50"
              disabled={isAdding}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags (press Enter)"
              className="bg-secondary/50"
              disabled={isAdding}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

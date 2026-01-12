import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Trash2, Flag, X, FolderPlus } from 'lucide-react';
import { TaskPriority, Project } from '@/lib/types';

interface BulkActionsProps {
  selectedCount: number;
  projects: Project[];
  onMarkDone: () => void;
  onChangePriority: (priority: TaskPriority) => void;
  onAssignProject: (projectId: string | null) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedCount,
  projects,
  onMarkDone,
  onChangePriority,
  onAssignProject,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-soft animate-slide-up">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedCount} selected
      </span>
      
      <div className="h-4 w-px bg-border" />
      
      <Button variant="ghost" size="sm" onClick={onMarkDone} className="gap-2">
        <CheckCircle className="h-4 w-4" />
        Mark done
      </Button>
      
      <Select onValueChange={(value) => onChangePriority(value as TaskPriority)}>
        <SelectTrigger className="w-32 h-8">
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3" />
            Priority
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onAssignProject(value === 'none' ? null : value)}>
        <SelectTrigger className="w-36 h-8">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-3 w-3" />
            Project
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Project</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: project.color || '#6366f1' }} 
                />
                {project.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button variant="ghost" size="sm" onClick={onDelete} className="gap-2 text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      
      <div className="flex-1" />
      
      <Button variant="ghost" size="icon" onClick={onClearSelection} className="h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

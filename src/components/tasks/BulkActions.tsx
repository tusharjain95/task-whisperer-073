import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Trash2, Flag, X } from 'lucide-react';
import { TaskPriority } from '@/lib/types';

interface BulkActionsProps {
  selectedCount: number;
  onMarkDone: () => void;
  onChangePriority: (priority: TaskPriority) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedCount,
  onMarkDone,
  onChangePriority,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-soft animate-slide-up">
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

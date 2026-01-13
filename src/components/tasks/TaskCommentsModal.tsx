import { Task } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TaskComments from './TaskComments';

interface TaskCommentsModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export default function TaskCommentsModal({ task, open, onClose }: TaskCommentsModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">{task.title}</DialogTitle>
        </DialogHeader>
        <TaskComments taskId={task.id} />
      </DialogContent>
    </Dialog>
  );
}
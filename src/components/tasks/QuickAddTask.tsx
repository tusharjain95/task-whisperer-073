import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';

export default function QuickAddTask() {
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { createTask } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAdding(true);
    try {
      await createTask.mutateAsync({ title: title.trim() });
      setTitle('');
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="pl-10 h-11 bg-card"
          disabled={isAdding}
        />
      </div>
      <Button type="submit" disabled={!title.trim() || isAdding} className="h-11 px-6">
        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
      </Button>
    </form>
  );
}

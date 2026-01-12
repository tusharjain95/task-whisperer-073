import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet  
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
];

export default function QuickAddProject() {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { createProject } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsAdding(true);
    try {
      await createProject.mutateAsync({ name: name.trim(), color });
      setName('');
      setColor(PROJECT_COLORS[0]);
      setIsOpen(false);
      toast.success('Project created');
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New Project
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              disabled={isAdding}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!name.trim() || isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Project'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

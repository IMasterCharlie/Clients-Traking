'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, GripVertical, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TaskCardProps {
  task: any;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors: any = {
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${task.projectId}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', task.projectId] });
      toast.success('Task updated');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${task.projectId}/tasks/${task._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', task.projectId] });
      toast.success('Task deleted');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate') || undefined,
    };
    updateTaskMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div ref={setNodeRef} style={style} className="group relative">
        <SheetTrigger asChild>
          <Card className={`cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all duration-200 ${isOverlay ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div {...attributes} {...listeners} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-700 line-clamp-2 mb-2">{task.title}</h4>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 uppercase font-bold ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>
      </div>

      <SheetContent className="sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Edit Task</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleUpdate} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={task.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={task.description} rows={4} placeholder="Add more details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-between gap-3">
            <Button type="button" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => deleteTaskMutation.mutate()} disabled={deleteTaskMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Task
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

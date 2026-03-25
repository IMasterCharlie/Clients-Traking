'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  projectId: string;
}

export function KanbanColumn({ id, title, tasks, projectId }: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const queryClient = useQueryClient();

  const { setNodeRef } = useDroppable({
    id,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsAdding(false);
      setNewTaskTitle('');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      status: id,
    });
  };

  return (
    <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200/60 p-4 h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-700 capitalize">{title}</h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>

        {isAdding ? (
          <div className="bg-white p-3 rounded-lg border-2 border-indigo-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="What needs to be done?"
              className="mb-2 border-none focus-visible:ring-0 p-0 text-sm"
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="icon" className="h-7 w-7 bg-indigo-600" onClick={handleAddTask} disabled={createTaskMutation.isPending}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

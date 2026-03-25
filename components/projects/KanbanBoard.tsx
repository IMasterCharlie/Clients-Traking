'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KanbanBoardProps {
  projectId: string;
  initialTasks: any;
}

export function KanbanBoard({ projectId, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTask(active.id as string);
    setActiveTask(task);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTask(activeId);
    if (!activeTask) return;

    const overTask = findTask(overId);
    const isOverColumn = ['todo', 'in_progress', 'done'].includes(overId);

    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev: any) => {
        const activeItems = [...prev[activeTask.status]];
        const overItems = [...prev[overTask.status]];

        const activeIndex = activeItems.findIndex(i => i._id === activeId);
        const overIndex = overItems.findIndex(i => i._id === overId);

        const [movedItem] = activeItems.splice(activeIndex, 1);
        movedItem.status = overTask.status;
        overItems.splice(overIndex, 0, movedItem);

        return {
          ...prev,
          [activeTask.status]: activeItems,
          [overTask.status]: overItems,
        };
      });
    } else if (isOverColumn && activeTask.status !== overId) {
      setTasks((prev: any) => {
        const activeItems = [...prev[activeTask.status]];
        const overItems = [...prev[overId as keyof typeof prev]];

        const activeIndex = activeItems.findIndex(i => i._id === activeId);
        const [movedItem] = activeItems.splice(activeIndex, 1);
        movedItem.status = overId as any;
        overItems.push(movedItem);

        return {
          ...prev,
          [activeTask.status]: activeItems,
          [overId]: overItems,
        };
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTask(activeId);
    const overTask = findTask(overId);

    if (activeTask && overTask && activeTask.status === overTask.status) {
      const items = [...tasks[activeTask.status]];
      const oldIndex = items.findIndex(i => i._id === activeId);
      const newIndex = items.findIndex(i => i._id === overId);

      if (oldIndex !== newIndex) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setTasks((prev: any) => ({
          ...prev,
          [activeTask.status]: newItems,
        }));

        // Persist order
        updateTaskMutation.mutate({
          taskId: activeId,
          data: { order: newIndex },
        });
      }
    } else if (activeTask && overTask && activeTask.status !== overTask.status) {
      // Already handled in onDragOver for UI, but persist here
      const items = [...tasks[overTask.status]];
      const newIndex = items.findIndex(i => i._id === activeId);
      updateTaskMutation.mutate({
        taskId: activeId,
        data: { status: overTask.status, order: newIndex },
      });
    } else if (activeTask && ['todo', 'in_progress', 'done'].includes(overId)) {
      // Persist status change if dropped on empty column
      updateTaskMutation.mutate({
        taskId: activeId,
        data: { status: overId, order: tasks[overId].length - 1 },
      });
    }

    setActiveTask(null);
  };

  const findTask = (id: string) => {
    for (const status of ['todo', 'in_progress', 'done'] as const) {
      const task = tasks[status].find((t: any) => t._id === id);
      if (task) return task;
    }
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
        {(['todo', 'in_progress', 'done'] as const).map(status => (
          <KanbanColumn
            key={status}
            id={status}
            title={status.replace('_', ' ')}
            tasks={tasks[status]}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

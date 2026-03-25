'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      'rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50',
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-base font-bold text-slate-700">{title}</p>
      {description && (
        <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <Button
          size="sm"
          className="mt-5 bg-indigo-600 hover:bg-indigo-700 gap-2"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

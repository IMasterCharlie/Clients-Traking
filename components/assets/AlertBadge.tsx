'use client';

import { useExpiry } from '@/hooks/use-expiry';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AlertBadgeProps {
  date?: string | Date | null;
  className?: string;
  showDays?: boolean;
}

export function AlertBadge({ date, className, showDays = true }: AlertBadgeProps) {
  const { daysLeft, isExpired, isCritical, isWarning } = useExpiry(date);

  if (!date || daysLeft === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
          'bg-slate-100 text-slate-400',
          className
        )}
      >
        <Clock className="w-3 h-3" />
        Not set
      </span>
    );
  }

  if (isExpired) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
          'bg-red-100 text-red-600 border border-red-200',
          className
        )}
      >
        <XCircle className="w-3 h-3" />
        Expired
      </span>
    );
  }

  if (isCritical) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
          'bg-red-100 text-red-600 border border-red-200',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        {showDays ? `${daysLeft}d left` : 'Critical'}
      </span>
    );
  }

  if (isWarning) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
          'bg-amber-100 text-amber-600 border border-amber-200',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        {showDays ? `${daysLeft}d left` : 'Warning'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        'bg-emerald-100 text-emerald-600 border border-emerald-200',
        className
      )}
    >
      <CheckCircle className="w-3 h-3" />
      {showDays ? `${daysLeft}d left` : 'Good'}
    </span>
  );
}

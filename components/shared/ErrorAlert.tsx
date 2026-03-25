'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ message = 'Something went wrong. Please try again.', onRetry, className }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 mt-1">
        <span>{message}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 gap-1.5 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="text-slate-500 mt-2 leading-relaxed">
            An unexpected error occurred. Our team has been notified. Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mt-2 font-mono">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={reset}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-indigo-100 opacity-60" />
          <div className="relative flex items-center justify-center w-full h-full">
            <span className="text-6xl font-black text-indigo-600 select-none">404</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-slate-500 mt-2 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects" className="gap-2">
              <Search className="w-4 h-4" />
              Browse Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

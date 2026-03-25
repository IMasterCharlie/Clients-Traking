'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FolderKanban, Users, CreditCard, Key, FileText, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityEntry {
  _id: string;
  action: string;
  description: string;
  entity?: string;
  ipAddress?: string;
  createdAt: string;
}

const ENTITY_META: Record<string, { icon: React.ElementType; color: string }> = {
  projects:    { icon: FolderKanban, color: 'text-violet-600' },
  clients:     { icon: Users,        color: 'text-blue-600' },
  payments:    { icon: CreditCard,   color: 'text-emerald-600' },
  credentials: { icon: Key,          color: 'text-rose-600' },
  invoices:    { icon: FileText,     color: 'text-amber-600' },
  settings:    { icon: Settings,     color: 'text-slate-500' },
};

function actionLabel(action: string) {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const res = await fetch('/api/activity?limit=10');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.logs as ActivityEntry[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const logs = data || [];

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <CardTitle className="text-base font-bold text-slate-800">Recent Activity</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Activity className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm font-medium">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-0 pt-2 max-h-[320px] overflow-y-auto">
            {logs.map((log, idx) => {
              const meta = (log.entity && ENTITY_META[log.entity]) || { icon: Activity, color: 'text-slate-500' };
              const Icon = meta.icon;
              return (
                <div
                  key={log._id}
                  className={cn(
                    'flex gap-3 py-2.5 border-b border-slate-100 last:border-0'
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={cn('w-3.5 h-3.5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">
                      {actionLabel(log.action)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {log.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

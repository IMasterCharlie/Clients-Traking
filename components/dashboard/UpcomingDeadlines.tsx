'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Deadline {
  _id: string;
  title: string;
  deadline: string;
  color?: string;
  status: string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

function urgencyStyle(daysLeft: number) {
  if (daysLeft <= 2) return { bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', label: `${daysLeft}d` };
  if (daysLeft <= 7) return { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: `${daysLeft}d` };
  return { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: `${daysLeft}d` };
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-violet-600" />
          </div>
          <CardTitle className="text-base font-bold text-slate-800">Upcoming Deadlines</CardTitle>
        </div>
        <span className="text-xs text-slate-400 font-medium">Next 14 days</span>
      </CardHeader>

      <CardContent className="pt-2 px-4 pb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <CalendarClock className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm font-medium">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {sorted.map((d) => {
              const daysLeft = differenceInDays(new Date(d.deadline), new Date());
              const { bar, badge, label } = urgencyStyle(daysLeft);
              return (
                <Link
                  key={d._id}
                  href={`/projects/${d._id}`}
                  className="group flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-1 px-1 rounded-lg transition-colors"
                >
                  <div
                    className="w-2.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: d.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {d.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(d.deadline), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={cn('text-xs font-bold px-2 py-1 rounded-full shrink-0', badge)}>
                    {label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

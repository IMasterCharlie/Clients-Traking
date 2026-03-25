'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { History, User, Globe, AlertCircle } from 'lucide-react';

interface ActivityListProps {
  activities: any[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const actionColors: any = {
    PROJECT_CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    PROJECT_UPDATE: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    PROJECT_ARCHIVE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    TASK_CREATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    TASK_UPDATE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    TASK_DELETE: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    TIMELOG_CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    TIMELOG_DELETE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No activity logged yet</p>
        <p className="text-sm">Recent actions on this project will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity._id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${actionColors[activity.action]?.split(' ')[0] || 'bg-slate-100'}`}>
                <AlertCircle className={`w-5 h-5 ${actionColors[activity.action]?.split(' ')[1] || 'text-slate-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${actionColors[activity.action] || ''}`}>
                    {activity.action.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    {format(new Date(activity.createdAt), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium mb-2">{activity.description}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>System Admin</span>
                  </div>
                  {activity.ipAddress && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>{activity.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

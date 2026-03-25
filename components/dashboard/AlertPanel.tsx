'use client';

import { useNotifications, INotification } from '@/hooks/use-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bell,
  Server,
  Globe,
  Shield,
  CreditCard,
  FileText,
  RefreshCw,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; urgency: number }> = {
  hosting_expiry:   { icon: Server,     color: 'text-blue-600',   bg: 'bg-blue-50',   urgency: 2 },
  domain_expiry:    { icon: Globe,      color: 'text-indigo-600', bg: 'bg-indigo-50', urgency: 2 },
  ssl_expiry:       { icon: Shield,     color: 'text-emerald-600',bg: 'bg-emerald-50',urgency: 2 },
  payment_overdue:  { icon: CreditCard, color: 'text-rose-600',   bg: 'bg-rose-50',   urgency: 1 },
  subscription_due: { icon: RefreshCw,  color: 'text-amber-600',  bg: 'bg-amber-50',  urgency: 1 },
  invoice_sent:     { icon: FileText,   color: 'text-slate-600',  bg: 'bg-slate-50',  urgency: 3 },
  invoice_overdue:  { icon: FileText,   color: 'text-rose-600',   bg: 'bg-rose-50',   urgency: 1 },
};

function AlertItem({ n }: { n: INotification }) {
  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50', urgency: 3 };
  const Icon = meta.icon;
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
        <Icon className={cn('w-4 h-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{n.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
        <p className="text-[10px] text-slate-400 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function AlertPanel() {
  const { notifications, unreadCount, markAllRead } = useNotifications(20);

  // Show only unread, sorted by urgency (lower = more urgent)
  const unread = notifications
    .filter((n) => !n.isRead)
    .sort((a, b) => (TYPE_META[a.type]?.urgency || 3) - (TYPE_META[b.type]?.urgency || 3))
    .slice(0, 8);

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <CardTitle className="text-base font-bold text-slate-800">Alerts</CardTitle>
          {unreadCount > 0 && (
            <span className="text-xs font-bold text-white bg-rose-500 rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 h-7 px-2"
            onClick={markAllRead}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-2 px-4 pb-4">
        {unread.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600">All clear</p>
            <p className="text-xs mt-1">No active alerts right now</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            {unread.map((n) => <AlertItem key={n._id} n={n} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

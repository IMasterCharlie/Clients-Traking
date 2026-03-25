'use client';

import { useNotifications, INotification } from '@/hooks/use-notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Server, Globe, Shield, CreditCard, FileText, RefreshCw, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  hosting_expiry:   { icon: Server,     color: 'text-blue-500' },
  domain_expiry:    { icon: Globe,      color: 'text-indigo-500' },
  ssl_expiry:       { icon: Shield,     color: 'text-emerald-500' },
  payment_overdue:  { icon: CreditCard, color: 'text-rose-500' },
  subscription_due: { icon: RefreshCw,  color: 'text-amber-500' },
  invoice_sent:     { icon: FileText,   color: 'text-slate-500' },
  invoice_overdue:  { icon: FileText,   color: 'text-rose-500' },
};

function NotifItem({ n }: { n: INotification }) {
  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-slate-400' };
  const Icon = meta.icon;
  return (
    <div className={cn(
      'flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80',
      !n.isRead && 'bg-indigo-50/40 border-l-2 border-indigo-400'
    )}>
      <div className={cn('mt-0.5 shrink-0', meta.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-slate-400 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications(10);
  const latest = notifications.slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={6} className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-white bg-rose-500 rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
          {latest.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">All clear!</p>
              <p className="text-xs mt-0.5">No new notifications</p>
            </div>
          ) : (
            latest.map((n) => <NotifItem key={n._id} n={n} />)
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2.5 flex justify-center">
          <Link
            href="/notifications"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

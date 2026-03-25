'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { INotification } from '@/hooks/use-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Server,
  Globe,
  Shield,
  CreditCard,
  FileText,
  RefreshCw,
  CheckCheck,
  Filter,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  hosting_expiry:   { icon: Server,     color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Hosting' },
  domain_expiry:    { icon: Globe,      color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Domain' },
  ssl_expiry:       { icon: Shield,     color: 'text-emerald-600',bg: 'bg-emerald-50',label: 'SSL' },
  payment_overdue:  { icon: CreditCard, color: 'text-rose-600',   bg: 'bg-rose-50',   label: 'Payment' },
  subscription_due: { icon: RefreshCw,  color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Subscription' },
  invoice_sent:     { icon: FileText,   color: 'text-slate-600',  bg: 'bg-slate-50',  label: 'Invoice' },
  invoice_overdue:  { icon: FileText,   color: 'text-rose-600',   bg: 'bg-rose-50',   label: 'Invoice' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'hosting_expiry', label: 'Hosting' },
  { key: 'domain_expiry', label: 'Domain' },
  { key: 'ssl_expiry', label: 'SSL' },
  { key: 'payment_overdue', label: 'Payments' },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=50');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as { notifications: INotification[]; unreadCount: number };
    },
    refetchInterval: 60_000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const allNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const filtered = allNotifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-start"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0 divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 p-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/3 bg-slate-100 animate-pulse rounded" />
                      <div className="h-3 w-2/3 bg-slate-100 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCheck className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-slate-600">Nothing here</p>
                <p className="text-sm mt-1">
                  {activeFilter !== 'all' ? 'No notifications match this filter' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((n) => {
                  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Alert' };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n._id}
                      className={cn(
                        'flex gap-4 p-5 transition-colors hover:bg-slate-50/50 cursor-pointer',
                        !n.isRead && 'bg-indigo-50/30 border-l-2 border-indigo-400'
                      )}
                      onClick={() => !n.isRead && markOneRead.mutate(n._id)}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                        <Icon className={cn('w-5 h-5', meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">{n.title}</p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase px-1.5"
                          >
                            {meta.label}
                          </Badge>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {format(new Date(n.createdAt), 'MMM d, yyyy · h:mm a')} ·{' '}
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markOneRead.mutate(n._id);
                          }}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium shrink-0 mt-1"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

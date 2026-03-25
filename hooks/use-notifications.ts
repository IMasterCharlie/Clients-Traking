'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface INotification {
  _id: string;
  userId: string;
  type: 'hosting_expiry' | 'domain_expiry' | 'ssl_expiry' | 'payment_overdue' | 'invoice_sent' | 'subscription_due' | 'invoice_overdue';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

const QUERY_KEY = ['notifications'];

export function useNotifications(limit = 20) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as {
        notifications: INotification[];
        unreadCount: number;
        total: number;
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old: any) =>
        old
          ? {
              ...old,
              unreadCount: 0,
              notifications: old.notifications.map((n: INotification) => ({ ...n, isRead: true })),
            }
          : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old: any) =>
        old
          ? {
              ...old,
              unreadCount: Math.max(0, old.unreadCount - ids.length),
              notifications: old.notifications.map((n: INotification) =>
                ids.includes(n._id) ? { ...n, isRead: true } : n
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markAllRead: () => markAllRead.mutate(),
    markRead: (ids: string[]) => markRead.mutate(ids),
  };
}

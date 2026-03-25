'use client';

import { useQuery } from '@tanstack/react-query';

export interface DashboardData {
  totalClients: number;
  activeProjects: number;
  monthlyRevenue: number;
  unreadAlerts: number;
  overduePayments: number;
  revenueByMonth: { month: string; revenue: number }[];
  recentPayments: Array<{
    _id: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    paidDate?: string;
    description: string;
    clientId?: { name: string; company?: string };
  }>;
  upcomingDeadlines: Array<{
    _id: string;
    title: string;
    deadline: string;
    color?: string;
    status: string;
  }>;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

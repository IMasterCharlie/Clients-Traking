'use client';

import { useQuery } from '@tanstack/react-query';

export interface PLData {
  income: number;
  expenses: number;
  net: number;
  byClient: { clientId: string; clientName: string; total: number }[];
  byProject: { projectId: string; projectTitle: string; total: number }[];
  byMonth: { month: string; income: number }[];
  invoiceCount: number;
  avgInvoiceValue: number;
  period: { from: string; to: string; year: number; month: number | null };
}

export function useReports(year: number, month: number | null, clientId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (month) params.set('month', String(month));
  if (clientId) params.set('clientId', clientId);

  return useQuery<PLData>({
    queryKey: ['reports-pl', year, month, clientId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/pl?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 60_000,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/profile');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 120_000,
  });
}

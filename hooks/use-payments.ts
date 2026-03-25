import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface PaymentFilters {
  status?: string;
  clientId?: string;
  from?: string;
  to?: string;
  page?: number;
}

export function usePayments(initialFilters: PaymentFilters = {}) {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const res = await fetch(`/api/payments?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
  });

  return {
    ...query,
    filters,
    setFilters,
  };
}

export function useInvoices(initialFilters: any = {}) {
  const [filters, setFilters] = useState({
    page: 1,
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    },
  });

  return {
    ...query,
    filters,
    setFilters,
  };
}

import { useCallback } from 'react';

export function useCurrency(currency: string = 'INR') {
  const formatAmount = useCallback(
    (amount: number) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    [currency]
  );

  return { formatAmount, currency };
}

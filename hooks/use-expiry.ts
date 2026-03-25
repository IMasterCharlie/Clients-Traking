import { useMemo } from 'react';

export function useExpiry(dateString?: string | Date | null) {
  return useMemo(() => {
    if (!dateString) {
      return { daysLeft: null, isExpired: false, isCritical: false, isWarning: false };
    }
    const now = new Date();
    const expiry = new Date(dateString);
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;
    const isCritical = daysLeft <= 7; // includes expired
    const isWarning = !isCritical && daysLeft <= 30;
    return { daysLeft, isExpired, isCritical, isWarning };
  }, [dateString]);
}

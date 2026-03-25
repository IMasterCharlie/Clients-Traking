import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="mt-1 text-2xl font-bold">{value}</h3>
            {trend && (
              <p className={cn(
                'mt-1 text-xs font-medium',
                trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {trend.isPositive ? '+' : '-'}{trend.value}%
                <span className="ml-1 text-muted-foreground font-normal">from last month</span>
              </p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

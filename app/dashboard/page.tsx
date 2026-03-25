'use client';
import dynamic from 'next/dynamic';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useDashboard } from '@/hooks/use-dashboard';
import { useCurrency } from '@/hooks/use-currency';
const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })), { ssr: false, loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-xl" /> });
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  FolderKanban,
  DollarSign,
  Bell,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  alert,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <Card
      className={cn(
        'border-slate-200 shadow-sm transition-shadow hover:shadow-md',
        alert && 'border-amber-200 bg-amber-50/30'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            <h3 className="mt-1.5 text-2xl font-bold text-foreground">{value}</h3>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatCardSkeleton() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
            <div className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { formatAmount } = useCurrency();

  const monthlyRevenue = data?.monthlyRevenue ?? 0;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Page heading */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome back. Here's what's happening.</p>
        </div>

        {/* ── Quick Actions ── */}
        <QuickActions />

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Active Clients"
                value={data?.totalClients ?? 0}
                icon={Users}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                href="/clients"
              />
              <StatCard
                label="Active Projects"
                value={data?.activeProjects ?? 0}
                icon={FolderKanban}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                href="/projects"
              />
              <StatCard
                label="Monthly Revenue"
                value={formatAmount(monthlyRevenue)}
                icon={DollarSign}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                href="/payments"
              />
              <StatCard
                label="Unread Alerts"
                value={data?.unreadAlerts ?? 0}
                icon={Bell}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                href="/notifications"
                alert={(data?.unreadAlerts ?? 0) > 0}
              />
            </>
          )}
        </div>

        {/* Overdue banner */}
        {!isLoading && (data?.overduePayments ?? 0) > 0 && (
          <Link href="/payments">
            <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">
                {data!.overduePayments} overdue payment{data!.overduePayments !== 1 ? 's' : ''} require your attention
              </p>
              <span className="ml-auto text-xs font-bold">View →</span>
            </div>
          </Link>
        )}

        {/* ── Row 2: Revenue Chart + Alert Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isLoading ? (
              <Card className="border-slate-200 shadow-sm h-full">
                <CardContent className="p-6">
                  <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
                </CardContent>
              </Card>
            ) : (
              <RevenueChart data={data?.revenueByMonth ?? []} />
            )}
          </div>
          <div className="lg:col-span-1">
            <AlertPanel />
          </div>
        </div>

        {/* ── Row 3: Recent Activity + Upcoming Deadlines ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          {isLoading ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <UpcomingDeadlines deadlines={data?.upcomingDeadlines ?? []} />
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

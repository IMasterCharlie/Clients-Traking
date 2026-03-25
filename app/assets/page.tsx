'use client';

import { useAssetsOverview } from '@/hooks/use-assets';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { AlertBadge } from '@/components/assets/AlertBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExpiry } from '@/hooks/use-expiry';
import Link from 'next/link';
import {
  Server,
  Globe,
  Shield,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

function ExpiryCell({ date }: { date: string | null }) {
  return <AlertBadge date={date} showDays />;
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{count}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
        {count > 0 ? (
          <AlertTriangle className="w-5 h-5 text-amber-500 ml-auto" />
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
        )}
      </CardContent>
    </Card>
  );
}

function ProjectRow({
  row,
}: {
  row: {
    projectId: string;
    title: string;
    color: string;
    status: string;
    client: { name: string; company?: string } | null;
    hostingExpiry: string | null;
    hostingProvider: string | null;
    domainExpiry: string | null;
    domainName: string | null;
    sslExpiry: string | null;
    sslProvider: string | null;
  };
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: row.color || '#4f46e5' }}
          >
            {row.title.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{row.title}</p>
            <p className="text-xs text-slate-400">{row.client?.name || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1">
          {row.hostingProvider && <p className="text-xs text-slate-500">{row.hostingProvider}</p>}
          <ExpiryCell date={row.hostingExpiry} />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1">
          {row.domainName && <p className="text-xs text-slate-500">{row.domainName}</p>}
          <ExpiryCell date={row.domainExpiry} />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1">
          {row.sslProvider && <p className="text-xs text-slate-500">{row.sslProvider}</p>}
          <ExpiryCell date={row.sslExpiry} />
        </div>
      </td>
      <td className="px-5 py-4">
        <Link href={`/projects/${row.projectId}?tab=assets`}>
          <Button size="sm" variant="ghost" className="gap-1 text-indigo-600 hover:text-indigo-700">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </td>
    </tr>
  );
}

export default function AssetsPage() {
  const { data, isLoading, refetch, isFetching } = useAssetsOverview();

  const expiringSoon =
    data?.rows.filter((r) => {
      const check = (d: string | null) => {
        if (!d) return false;
        const days = Math.floor((new Date(d).getTime() - Date.now()) / 86_400_000);
        return days <= 30;
      };
      return check(r.hostingExpiry) || check(r.domainExpiry) || check(r.sslExpiry);
    }) || [];

  const normal = data?.rows.filter((r) => !expiringSoon.includes(r)) || [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Technical Assets</h1>
            <p className="text-slate-500 mt-1">
              Monitor hosting, domain, and SSL expiry across all projects.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 self-start"
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={Server}
              label="Hosting renewals due"
              count={data.summary.hostingDue}
              color="bg-blue-100 text-blue-600"
            />
            <SummaryCard
              icon={Globe}
              label="Domains expiring soon"
              count={data.summary.domainsDue}
              color="bg-indigo-100 text-indigo-600"
            />
            <SummaryCard
              icon={Shield}
              label="SSL certs expiring"
              count={data.summary.sslDue}
              color="bg-emerald-100 text-emerald-600"
            />
          </div>
        )}

        {/* Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">All Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : !data?.rows.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Server className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-semibold">No projects found</p>
                <p className="text-sm">Create a project to start tracking assets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5" /> Hosting
                        </div>
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Domain
                        </div>
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> SSL
                        </div>
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.length > 0 && (
                      <>
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-2 bg-amber-50 border-y border-amber-100"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Expiring Soon ({expiringSoon.length})
                            </div>
                          </td>
                        </tr>
                        {expiringSoon.map((row) => (
                          <ProjectRow key={row.projectId} row={row} />
                        ))}
                      </>
                    )}
                    {normal.length > 0 && (
                      <>
                        {expiringSoon.length > 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-2 bg-slate-50 border-y border-slate-100"
                            >
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                All Projects
                              </span>
                            </td>
                          </tr>
                        )}
                        {normal.map((row) => (
                          <ProjectRow key={row.projectId} row={row} />
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

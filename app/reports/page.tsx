'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useReports } from '@/hooks/use-reports';
import { useCurrency } from '@/hooks/use-currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, TrendingDown, FileText,
  Download, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-base font-bold text-indigo-600">
        {currency} {Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);

  const { data, isLoading } = useReports(year, month);
  const { formatAmount, currency } = useCurrency();

  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  // Pie chart data — top 5 + Others
  const pieData = useMemo(() => {
    if (!data?.byClient.length) return [];
    const top5 = data.byClient.slice(0, 5);
    const othersTotal = data.byClient.slice(5).reduce((s, c) => s + c.total, 0);
    const result = top5.map((c) => ({ name: c.clientName, value: c.total }));
    if (othersTotal > 0) result.push({ name: 'Others', value: othersTotal });
    return result;
  }, [data?.byClient]);

  const triggerDownload = async (type: 'csv' | 'pdf') => {
    setDownloading(type);
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set('month', String(month));
      const res = await fetch(`/api/reports/export/${type}?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv'
        ? `devmanager-${year}${month ? `-${month}` : ''}.csv`
        : `pl-report-${year}${month ? `-${month}` : ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-7">

        {/* Header + controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-slate-500 mt-1 text-sm">Analyze your business performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Year */}
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-28 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Month */}
            <Select value={month ? String(month) : 'all'} onValueChange={(v) => setMonth(v === 'all' ? null : parseInt(v))}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Export CSV */}
            <Button
              size="sm"
              variant="outline"
              className="gap-2 h-9"
              onClick={() => triggerDownload('csv')}
              disabled={downloading !== null}
            >
              {downloading === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              CSV
            </Button>

            {/* Export PDF */}
            <Button
              size="sm"
              variant="outline"
              className="gap-2 h-9"
              onClick={() => triggerDownload('pdf')}
              disabled={downloading !== null}
            >
              {downloading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard label="Total Income" value={formatAmount(data?.income ?? 0)} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="Total Expenses" value={formatAmount(data?.expenses ?? 0)} icon={TrendingDown} color="bg-rose-50 text-rose-500" />
              <StatCard label="Net Profit" value={formatAmount(data?.net ?? 0)} icon={DollarSign} color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Invoices Raised" value={String(data?.invoiceCount ?? 0)} icon={FileText} color="bg-amber-50 text-amber-600" />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Monthly Income</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-2">
              {isLoading ? (
                <div className="h-52 bg-slate-100 animate-pulse rounded-xl" />
              ) : !data?.byMonth.length ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm">
                  {month ? 'Monthly breakdown not available for single-month view' : 'No data for this period'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `${currency} ${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false} width={72}
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Revenue by Client</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              {isLoading ? (
                <div className="h-52 bg-slate-100 animate-pulse rounded-xl" />
              ) : pieData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No client data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 10, color: '#64748b' }}>{value}</span>}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Breakdown table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">Revenue by Client</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0 divide-y divide-slate-100 p-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 animate-pulse rounded my-2" />
                ))}
              </div>
            ) : !data?.byClient.length ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                No revenue data for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byClient.map((c, i) => (
                      <tr key={c.clientId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className="font-semibold text-slate-800">{c.clientName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-700">
                          {formatAmount(c.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-slate-500 font-medium">
                            {data.income > 0 ? `${((c.total / data.income) * 100).toFixed(1)}%` : '0%'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-5 py-3 font-bold text-slate-700">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-indigo-600">{formatAmount(data.income)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-500">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}

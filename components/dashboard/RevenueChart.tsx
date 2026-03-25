'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  currency?: string;
}

function formatCurrency(value: number, currency = 'USD') {
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(1)}k`;
  return `${currency} ${value.toFixed(0)}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-base font-bold text-indigo-600">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
};

export function RevenueChart({ data, currency = 'USD' }: RevenueChartProps) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <CardTitle className="text-base font-bold text-slate-800">Revenue Overview</CardTitle>
        </div>
        <span className="text-xs font-medium text-slate-400">Last 12 months</span>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        {!hasData ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <p className="text-sm">No revenue data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, currency)}
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: '#f8fafc' }} />
              <Bar
                dataKey="revenue"
                fill="url(#revenueGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

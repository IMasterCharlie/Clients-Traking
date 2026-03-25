import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/jwt';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 32, borderBottomWidth: 2, borderBottomColor: '#6366f1', paddingBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#6366f1', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#64748b' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#334155' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  summaryLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowLast: { flexDirection: 'row' },
  th: { padding: '8 10', fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#475569' },
  td: { padding: '7 10', fontSize: 9, color: '#334155' },
  col1: { flex: 3 },
  col2: { flex: 2, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
});

function fmt(amount: number, currency = 'USD') {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PLDocument({ data, period }: { data: any; period: string }) {
  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: 'A4', style: styles.page },
        // Header
        React.createElement(View, { style: styles.header },
          React.createElement(Text, { style: styles.title }, 'Profit & Loss Report'),
          React.createElement(Text, { style: styles.subtitle }, `Period: ${period}  •  Generated: ${format(new Date(), 'MMM d, yyyy')}`),
        ),

        // Summary cards
        React.createElement(View, { style: styles.summaryRow },
          React.createElement(View, { style: { ...styles.summaryCard, borderLeftColor: '#10b981' } },
            React.createElement(Text, { style: styles.summaryLabel }, 'Total Income'),
            React.createElement(Text, { style: { ...styles.summaryValue, color: '#059669' } }, fmt(data.income)),
          ),
          React.createElement(View, { style: { ...styles.summaryCard, borderLeftColor: '#6366f1' } },
            React.createElement(Text, { style: styles.summaryLabel }, 'Net Profit'),
            React.createElement(Text, { style: styles.summaryValue }, fmt(data.net)),
          ),
          React.createElement(View, { style: { ...styles.summaryCard, borderLeftColor: '#f59e0b' } },
            React.createElement(Text, { style: styles.summaryLabel }, 'Invoices Paid'),
            React.createElement(Text, { style: styles.summaryValue }, String(data.invoiceCount)),
          ),
          React.createElement(View, { style: { ...styles.summaryCard, borderLeftColor: '#64748b' } },
            React.createElement(Text, { style: styles.summaryLabel }, 'Avg Invoice'),
            React.createElement(Text, { style: styles.summaryValue }, fmt(data.avgInvoiceValue)),
          ),
        ),

        // By Client
        data.byClient.length > 0 && React.createElement(View, { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Revenue by Client'),
          React.createElement(View, { style: styles.table },
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(Text, { style: { ...styles.th, ...styles.col1 } }, 'Client'),
              React.createElement(Text, { style: { ...styles.th, ...styles.col2 } }, 'Total'),
              React.createElement(Text, { style: { ...styles.th, ...styles.col3 } }, '% Share'),
            ),
            ...data.byClient.slice(0, 10).map((c: any, i: number, arr: any[]) =>
              React.createElement(View, { key: c.clientId, style: i === arr.length - 1 ? styles.tableRowLast : styles.tableRow },
                React.createElement(Text, { style: { ...styles.td, ...styles.col1 } }, c.clientName),
                React.createElement(Text, { style: { ...styles.td, ...styles.col2 } }, fmt(c.total)),
                React.createElement(Text, { style: { ...styles.td, ...styles.col3 } },
                  data.income > 0 ? `${((c.total / data.income) * 100).toFixed(1)}%` : '0%'
                ),
              )
            ),
          ),
        ),

        // By Month (when full year)
        data.byMonth.length > 0 && React.createElement(View, { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Monthly Breakdown'),
          React.createElement(View, { style: styles.table },
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(Text, { style: { ...styles.th, ...styles.col1 } }, 'Month'),
              React.createElement(Text, { style: { ...styles.th, ...styles.col2 } }, 'Income'),
            ),
            ...data.byMonth.map((m: any, i: number, arr: any[]) =>
              React.createElement(View, { key: m.month, style: i === arr.length - 1 ? styles.tableRowLast : styles.tableRow },
                React.createElement(Text, { style: { ...styles.td, ...styles.col1 } }, m.month),
                React.createElement(Text, { style: { ...styles.td, ...styles.col2 } }, fmt(m.income)),
              )
            ),
          ),
        ),

        // Footer
        React.createElement(View, { style: styles.footer },
          React.createElement(Text, { style: styles.footerText }, 'DevManager Pro'),
          React.createElement(Text, { style: styles.footerText }, `Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`),
        ),
      )
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const monthParam = searchParams.get('month');

    let from: Date, to: Date, periodLabel: string;
    if (monthParam) {
      const month = parseInt(monthParam);
      const d = new Date(year, month - 1, 1);
      from = startOfMonth(d);
      to = endOfMonth(d);
      periodLabel = format(d, 'MMMM yyyy');
    } else {
      from = startOfYear(new Date(year, 0, 1));
      to = endOfYear(new Date(year, 11, 31));
      periodLabel = String(year);
    }

    const payments = await Payment.find({
      userId: payload.userId,
      status: 'paid',
      paidDate: { $gte: from, $lte: to },
    })
      .populate('clientId', 'name company')
      .lean();

    const income = payments.reduce((s, p) => s + (p.amount || 0), 0);

    const clientMap = new Map<string, { clientId: string; clientName: string; total: number }>();
    for (const p of payments) {
      const c = p.clientId as any;
      if (!c) continue;
      const id = c._id.toString();
      const e = clientMap.get(id);
      if (e) e.total += p.amount;
      else clientMap.set(id, { clientId: id, clientName: c.company || c.name, total: p.amount });
    }
    const byClient = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);

    let byMonth: { month: string; income: number }[] = [];
    if (!monthParam) {
      const months = eachMonthOfInterval({ start: from, end: to });
      byMonth = months.map((m) => {
        const ms = startOfMonth(m), me = endOfMonth(m);
        const mi = payments.filter((p) => {
          const d = new Date(p.paidDate!);
          return d >= ms && d <= me;
        }).reduce((s, p) => s + p.amount, 0);
        return { month: format(m, 'MMM yy'), income: mi };
      });
    }

    const buffer = await renderToBuffer(
      React.createElement(PLDocument, {
        data: { income, expenses: 0, net: income, byClient, byMonth, invoiceCount: payments.length, avgInvoiceValue: payments.length ? income / payments.length : 0 },
        period: periodLabel,
      })
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pl-report-${periodLabel.replace(' ', '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

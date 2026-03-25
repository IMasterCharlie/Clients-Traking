import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';

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
    const clientFilter = searchParams.get('clientId');

    let from: Date;
    let to: Date;

    if (monthParam) {
      const month = parseInt(monthParam);
      const d = new Date(year, month - 1, 1);
      from = startOfMonth(d);
      to = endOfMonth(d);
    } else {
      from = startOfYear(new Date(year, 0, 1));
      to = endOfYear(new Date(year, 11, 31));
    }

    const paymentFilter: Record<string, unknown> = {
      userId: payload.userId,
      status: 'paid',
      paidDate: { $gte: from, $lte: to },
    };
    if (clientFilter) paymentFilter.clientId = clientFilter;

    const payments = await Payment.find(paymentFilter)
      .populate('clientId', 'name company')
      .populate('projectId', 'title')
      .lean();

    const income = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const expenses = 0; // placeholder

    // By client
    const clientMap = new Map<string, { clientId: string; clientName: string; total: number }>();
    for (const p of payments) {
      const c = p.clientId as any;
      if (!c) continue;
      const id = c._id.toString();
      const existing = clientMap.get(id);
      if (existing) {
        existing.total += p.amount;
      } else {
        clientMap.set(id, {
          clientId: id,
          clientName: c.company || c.name,
          total: p.amount,
        });
      }
    }
    const byClient = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);

    // By project
    const projectMap = new Map<string, { projectId: string; projectTitle: string; total: number }>();
    for (const p of payments) {
      const proj = p.projectId as any;
      if (!proj) continue;
      const id = proj._id.toString();
      const existing = projectMap.get(id);
      if (existing) {
        existing.total += p.amount;
      } else {
        projectMap.set(id, {
          projectId: id,
          projectTitle: proj.title,
          total: p.amount,
        });
      }
    }
    const byProject = Array.from(projectMap.values()).sort((a, b) => b.total - a.total);

    // By month (only for full year)
    let byMonth: { month: string; income: number }[] = [];
    if (!monthParam) {
      const months = eachMonthOfInterval({ start: from, end: to });
      byMonth = months.map((m) => {
        const monthStart = startOfMonth(m);
        const monthEnd = endOfMonth(m);
        const monthIncome = payments
          .filter((p) => {
            const d = new Date(p.paidDate!);
            return d >= monthStart && d <= monthEnd;
          })
          .reduce((sum, p) => sum + p.amount, 0);
        return { month: format(m, 'MMM yy'), income: monthIncome };
      });
    }

    // Invoice stats
    const invoiceFilter: Record<string, unknown> = {
      userId: payload.userId,
      status: 'paid',
      paidAt: { $gte: from, $lte: to },
    };
    if (clientFilter) invoiceFilter.clientId = clientFilter;
    const invoiceCount = await Invoice.countDocuments(invoiceFilter);
    const avgInvoiceValue = invoiceCount > 0 ? income / invoiceCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        income,
        expenses,
        net: income - expenses,
        byClient,
        byProject,
        byMonth,
        invoiceCount,
        avgInvoiceValue,
        period: { from, to, year, month: monthParam ? parseInt(monthParam) : null },
      },
    });
  } catch (error) {
    console.error('Reports P&L error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

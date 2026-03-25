import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId?.toString();
    const now = new Date();

    const [
      totalClients,
      activeProjects,
      unreadAlerts,
      overduePayments,
      recentPayments,
      upcomingDeadlines,
    ] = await Promise.all([
      Client.countDocuments({ userId, status: 'active' }),
      Project.countDocuments({ userId, status: 'active' }),
      Notification.countDocuments({ userId, isRead: false }),
      Payment.countDocuments({ userId, status: 'overdue' }),
      Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('clientId', 'name company')
        .lean(),
      Project.find({
        userId,
        deadline: { $gte: now, $lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
      })
        .select('title deadline color status')
        .lean(),
    ]);

    // Monthly revenue — current month
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthlyRevenueDocs = await Payment.find({
      userId,
      status: 'paid',
      paidDate: { $gte: monthStart, $lte: monthEnd },
    }).select('amount');
    const monthlyRevenue = monthlyRevenueDocs.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Revenue by month — last 12 months
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const docs = await Payment.find({
        userId,
        status: 'paid',
        paidDate: { $gte: start, $lte: end },
      }).select('amount');
      const revenue = docs.reduce((sum, p) => sum + (p.amount || 0), 0);
      revenueByMonth.push({ month: format(monthDate, 'MMM yy'), revenue });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalClients,
        activeProjects,
        monthlyRevenue,
        unreadAlerts,
        overduePayments,
        revenueByMonth,
        recentPayments,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

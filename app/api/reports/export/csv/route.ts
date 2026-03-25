import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/jwt';
import { format } from 'date-fns';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const clientId = searchParams.get('clientId');

    const filter: Record<string, unknown> = { userId: payload.userId };
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.paidDate = dateFilter;
    }
    if (clientId) filter.clientId = clientId;

    const payments = await Payment.find(filter)
      .sort({ paidDate: -1, createdAt: -1 })
      .populate('clientId', 'name company')
      .populate('projectId', 'title')
      .lean();

    const headers = ['Date', 'Client', 'Project', 'Type', 'Description', 'Amount', 'Currency', 'Status'];
    const rows = payments.map((p) => {
      const client = p.clientId as any;
      const project = p.projectId as any;
      const date = p.paidDate
        ? format(new Date(p.paidDate), 'yyyy-MM-dd')
        : format(new Date(p.createdAt), 'yyyy-MM-dd');
      return [
        escapeCsv(date),
        escapeCsv(client?.company || client?.name || ''),
        escapeCsv(project?.title || ''),
        escapeCsv(p.type),
        escapeCsv(p.description),
        escapeCsv(p.amount),
        escapeCsv(p.currency),
        escapeCsv(p.status),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `devmanager-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

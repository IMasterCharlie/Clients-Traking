import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TimeLog from '@/models/TimeLog';
import { verifyToken } from '@/lib/jwt';
import { timeLogSchema } from '@/lib/validations/project';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const timelogs = await TimeLog.find({ projectId: id, userId: payload.userId }).sort({ date: -1 });

    const summary = timelogs.reduce((acc, log) => {
      acc.totalHours += log.hours;
      if (log.billable) {
        acc.billableHours += log.hours;
        if (!log.invoiceId) {
          acc.unbilledBillableHours += log.hours;
        }
      }
      return acc;
    }, { totalHours: 0, billableHours: 0, unbilledBillableHours: 0 });

    return NextResponse.json({ success: true, data: timelogs, summary });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = timeLogSchema.parse(body);

    const timelog = await TimeLog.create({
      ...validated,
      projectId: id,
      userId: payload.userId,
    });

    return NextResponse.json({ success: true, data: timelog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Validation error' }, { status: 400 });
  }
}

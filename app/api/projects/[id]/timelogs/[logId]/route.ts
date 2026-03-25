import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TimeLog from '@/models/TimeLog';
import { verifyToken } from '@/lib/jwt';
import { timeLogSchema } from '@/lib/validations/project';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, logId: string }> }) {
  const { id, logId } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = timeLogSchema.partial().parse(body);

    const timelog = await TimeLog.findOneAndUpdate(
      { _id: logId, projectId: id, userId: payload.userId },
      { $set: validated },
      { new: true }
    );

    if (!timelog) return NextResponse.json({ success: false, message: 'Time log not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: timelog });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Validation error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, logId: string }> }) {
  const { id, logId } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const timelog = await TimeLog.findOneAndDelete({ _id: logId, projectId: id, userId: payload.userId });

    if (!timelog) return NextResponse.json({ success: false, message: 'Time log not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Time log deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

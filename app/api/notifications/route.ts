import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: payload.userId };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = unreadOnly
      ? total
      : await Notification.countDocuments({ userId: payload.userId, isRead: false });

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount, total, page, limit },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

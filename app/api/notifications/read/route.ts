import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const filter: Record<string, unknown> = { userId: payload.userId };

    if (body.all === true) {
      // Mark all unread as read
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      filter._id = { $in: body.ids };
    } else {
      return NextResponse.json({ success: false, message: 'Provide ids[] or all:true' }, { status: 400 });
    }

    const result = await Notification.updateMany(filter, { $set: { isRead: true } });

    return NextResponse.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

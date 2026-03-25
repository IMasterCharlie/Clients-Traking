import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Communication from '@/models/Communication';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, commId: string }> }) {
  const { id, commId } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const comm = await Communication.findOneAndDelete({
      _id: commId,
      clientId: id,
      userId: payload.userId,
    });

    if (!comm) return NextResponse.json({ success: false, message: 'Communication not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Communication deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

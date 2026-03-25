import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { portalEnabled, regenerateToken } = await req.json();

    const update: any = {};
    if (typeof portalEnabled === 'boolean') update.portalEnabled = portalEnabled;
    if (regenerateToken) update.portalToken = uuidv4();

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: update },
      { new: true }
    );

    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

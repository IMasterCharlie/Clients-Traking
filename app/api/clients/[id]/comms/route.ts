import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Communication from '@/models/Communication';
import { verifyToken } from '@/lib/jwt';
import { commsSchema } from '@/lib/validations/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const comms = await Communication.find({ clientId: id, userId: payload.userId })
      .sort({ date: -1 });

    return NextResponse.json({ success: true, data: comms });
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
    const validated = commsSchema.parse(body);

    const comm = await Communication.create({
      ...validated,
      clientId: id,
      userId: payload.userId,
    });

    return NextResponse.json({ success: true, data: comm }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 400 });
  }
}

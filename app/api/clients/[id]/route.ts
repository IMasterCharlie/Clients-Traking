import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/jwt';
import { updateClientSchema } from '@/lib/validations/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const client = await Client.findOne({ _id: id, userId: payload.userId });
    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

    // Mock project count and last payment for now as requested
    const stats = {
      projectCount: 0,
      lastPaymentAmount: 0,
      totalPaid: 0,
      outstandingBalance: 0,
    };

    return NextResponse.json({ success: true, data: { ...client.toObject(), stats } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = updateClientSchema.parse(body);

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: validated },
      { new: true }
    );

    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

    // In a real app, log to activitylogs here
    
    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Client archived' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

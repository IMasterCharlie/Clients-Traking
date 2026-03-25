import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/jwt';
import { createClientSchema } from '@/lib/validations/client';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = { userId: payload.userId };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        clients,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List clients error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = createClientSchema.parse(body);

    const client = await Client.create({
      ...validated,
      userId: payload.userId,
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 400 });
  }
}

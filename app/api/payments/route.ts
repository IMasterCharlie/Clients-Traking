import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/jwt';
import { addMonths, setDate } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload: decoded } = await verifyToken(accessToken);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = { userId: decoded.userId };
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'name company')
      .populate('projectId', 'name')
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload: decoded } = await verifyToken(accessToken);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { isRecurring, recurringDay, dueDate } = body;

    let nextDueDate = null;
    if (isRecurring && recurringDay) {
      const baseDate = new Date(dueDate);
      nextDueDate = setDate(addMonths(baseDate, 1), recurringDay);
    }

    const payment = await Payment.create({
      ...body,
      userId: decoded.userId,
      nextDueDate,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

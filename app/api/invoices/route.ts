import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Counter from '@/models/Counter';
import { verifyToken } from '@/lib/jwt';

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
    const projectId = searchParams.get('projectId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = { userId: decoded.userId };
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (projectId) query.projectId = projectId;
    if (from || to) {
      query.issueDate = {};
      if (from) query.issueDate.$gte = new Date(from);
      if (to) query.issueDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name company')
      .populate('projectId', 'name')
      .sort({ issueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return NextResponse.json({
      invoices,
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
    const year = new Date().getFullYear();

    // Atomic increment for invoice number
    const counter = await Counter.findOneAndUpdate(
      { year },
      { $inc: { lastNumber: 1 } },
      { upsert: true, new: true }
    );

    const invoiceNumber = `INV-${year}-${counter.lastNumber.toString().padStart(4, '0')}`;

    // Calculate totals
    const subtotal = body.lineItems.reduce((acc: number, item: any) => acc + item.total, 0);
    const taxAmount = (subtotal * (body.taxRate || 0)) / 100;
    const discount = body.discount || 0;
    const total = subtotal + taxAmount - discount;

    const invoice = await Invoice.create({
      ...body,
      userId: decoded.userId,
      invoiceNumber,
      subtotal,
      taxAmount,
      total,
      status: 'draft',
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

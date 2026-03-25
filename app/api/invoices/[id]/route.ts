import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  context: any
): Promise<any> {
  try {
    const { id } = await context.params;
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload: decoded } = await verifyToken(accessToken);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await Invoice.findOne({ _id: id, userId: decoded.userId })
      .populate('clientId')
      .populate('projectId');

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: any
): Promise<any> {
  try {
    const { id } = await context.params;
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload: decoded } = await verifyToken(accessToken);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await Invoice.findOne({ _id: id, userId: decoded.userId });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    if (invoice.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft invoices can be deleted' }, { status: 400 });
    }

    await Invoice.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Invoice deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

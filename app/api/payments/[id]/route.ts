import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/jwt';
import { addMonths, setDate } from 'date-fns';

export async function PATCH(
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

    const body = await req.json();
    const payment = await Payment.findOne({ _id: id, userId: decoded.userId });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // If marking as paid
    if (body.status === 'paid' && payment.status !== 'paid') {
      body.paidDate = new Date();
      
      // If recurring, create the next payment
      if (payment.isRecurring && payment.recurringDay) {
        const nextDate = payment.nextDueDate || setDate(addMonths(new Date(payment.dueDate), 1), payment.recurringDay);
        
        await Payment.create({
          userId: payment.userId,
          clientId: payment.clientId,
          projectId: payment.projectId,
          type: payment.type,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          dueDate: nextDate,
          isRecurring: true,
          recurringDay: payment.recurringDay,
          nextDueDate: setDate(addMonths(nextDate, 1), payment.recurringDay),
          status: 'unpaid',
        });
      }
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json(updatedPayment);
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

    const payment = await Payment.findOne({ _id: id, userId: decoded.userId });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // Delete only if not linked to an invoice that is already sent/paid
    if (payment.invoiceId) {
      const Invoice = (await import('@/models/Invoice')).default;
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice && ['sent', 'paid', 'overdue'].includes(invoice.status)) {
        return NextResponse.json({ error: 'Cannot delete payment linked to a sent or paid invoice' }, { status: 400 });
      }
    }

    await Payment.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Payment deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

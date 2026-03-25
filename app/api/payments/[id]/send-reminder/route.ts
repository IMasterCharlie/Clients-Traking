import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/jwt';
import { sendEmail } from '@/lib/mailer';

export async function POST(
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

    const payment = await Payment.findOne({ _id: id, userId: decoded.userId }).populate('clientId');
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const client = payment.clientId as any;
    
    await sendEmail({
      to: client.email,
      subject: `Payment Reminder: ${payment.description}`,
      html: `
        <h1>Payment Reminder</h1>
        <p>Hello ${client.name},</p>
        <p>This is a friendly reminder for the following payment:</p>
        <ul>
          <li><strong>Description:</strong> ${payment.description}</li>
          <li><strong>Amount:</strong> ${payment.currency} ${payment.amount.toFixed(2)}</li>
          <li><strong>Due Date:</strong> ${new Date(payment.dueDate).toLocaleDateString()}</li>
        </ul>
        <p>Please ensure payment is made by the due date. Thank you!</p>
      `,
    });

    await Payment.findByIdAndUpdate(id, { reminderSent: true });

    return NextResponse.json({ message: 'Reminder sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

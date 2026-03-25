import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { generateInvoicePDF } from '@/lib/pdf';
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

    const invoice = await Invoice.findOne({ _id: id, userId: decoded.userId });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const client = await Client.findById(invoice.clientId);
    const user = await User.findById(decoded.userId);

    const pdfBuffer = await generateInvoicePDF(invoice, client, user);

    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${user.businessName || user.name}`,
      html: `
        <h1>New Invoice</h1>
        <p>Hello ${client.name},</p>
        <p>Please find attached the invoice ${invoice.invoiceNumber} for your recent project.</p>
        <p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <p>Thank you for your business!</p>
      `,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await Invoice.findByIdAndUpdate(id, { 
      status: 'sent',
      sentAt: new Date()
    });

    return NextResponse.json({ message: 'Invoice sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

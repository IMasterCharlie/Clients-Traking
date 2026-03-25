import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { generateInvoicePDF } from '@/lib/pdf';
import fs from 'fs/promises';
import path from 'path';

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

    // Store PDF in public folder for now
    const publicDir = path.join(process.cwd(), 'public', 'invoices');
    await fs.mkdir(publicDir, { recursive: true });
    
    const fileName = `${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(publicDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    const pdfUrl = `/invoices/${fileName}`;
    await Invoice.findByIdAndUpdate(id, { pdfUrl });

    return NextResponse.json({ pdfUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

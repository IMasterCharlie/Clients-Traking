import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Invoice from '@/models/Invoice';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await dbConnect();
    
    const client = await Client.findOne({ portalToken: token, portalEnabled: true })
      .select('name company email phone country currency');

    if (!client) return NextResponse.json({ success: false, message: 'Invalid or disabled portal link' }, { status: 404 });

    // Fetch real projects and invoices
    const projects = await Project.find({ clientId: client._id, isArchived: false }).sort({ createdAt: -1 });
    const invoices = await Invoice.find({ clientId: client._id }).sort({ issueDate: -1 });

    const data = {
      client,
      projects,
      invoices,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Credential from '@/models/Credential';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';
import { encryptCredential } from '@/lib/encryption';

async function getPayload(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return null;
  const { payload } = await verifyToken(token, 'access');
  return payload;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    await dbConnect();
    const payload = await getPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    // Never return encrypted fields
    const credentials = await Credential.find({ projectId, userId: payload.userId })
      .select('-passwordEnc -iv -authTag')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: credentials });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    await dbConnect();
    const payload = await getPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const { password, label, type, username, url, notes } = await req.json();

    if (!label || !type) {
      return NextResponse.json({ success: false, message: 'label and type are required' }, { status: 400 });
    }

    let encFields: { passwordEnc?: string; iv?: string; authTag?: string } = {};
    if (password) {
      encFields = encryptCredential(password);
    }

    const credential = await Credential.create({
      projectId,
      userId: payload.userId,
      label,
      type,
      username,
      url,
      notes,
      ...encFields,
    });

    // Return without encrypted fields
    const safeCredential = credential.toObject();
    delete safeCredential.passwordEnc;
    delete safeCredential.iv;
    delete safeCredential.authTag;

    return NextResponse.json({ success: true, data: safeCredential }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

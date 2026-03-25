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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; credId: string }> }
) {
  const { projectId, credId } = await params;
  try {
    await dbConnect();
    const payload = await getPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const { password, ...rest } = await req.json();

    const update: Record<string, unknown> = { ...rest };
    if (password) {
      const { passwordEnc, iv, authTag } = encryptCredential(password);
      update.passwordEnc = passwordEnc;
      update.iv = iv;
      update.authTag = authTag;
    }

    const credential = await Credential.findOneAndUpdate(
      { _id: credId, projectId, userId: payload.userId },
      { $set: update },
      { new: true }
    ).select('-passwordEnc -iv -authTag');

    if (!credential) return NextResponse.json({ success: false, message: 'Credential not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: credential });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; credId: string }> }
) {
  const { projectId, credId } = await params;
  try {
    await dbConnect();
    const payload = await getPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const credential = await Credential.findOneAndDelete({ _id: credId, projectId, userId: payload.userId });
    if (!credential) return NextResponse.json({ success: false, message: 'Credential not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Credential deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

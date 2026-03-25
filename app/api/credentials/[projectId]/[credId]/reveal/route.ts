import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Credential from '@/models/Credential';
import Project from '@/models/Project';
import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/jwt';
import { decryptCredential } from '@/lib/encryption';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; credId: string }> }
) {
  const { projectId, credId } = await params;
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Verify ownership via project
    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const credential = await Credential.findOne({ _id: credId, projectId, userId: payload.userId });
    if (!credential) return NextResponse.json({ success: false, message: 'Credential not found' }, { status: 404 });

    if (!credential.passwordEnc || !credential.iv || !credential.authTag) {
      return NextResponse.json({ success: false, message: 'No password stored' }, { status: 400 });
    }

    let plaintext: string;
    try {
      plaintext = decryptCredential({
        passwordEnc: credential.passwordEnc,
        iv: credential.iv,
        authTag: credential.authTag,
      });
    } catch {
      return NextResponse.json({ success: false, message: 'INTEGRITY_ERROR' }, { status: 500 });
    }

    // Update lastViewed
    await Credential.findByIdAndUpdate(credId, { lastViewed: new Date() });

    // Log the reveal event
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await ActivityLog.create({
      userId: payload.userId,
      projectId,
      action: 'REVEAL_CREDENTIAL',
      description: `Revealed password for credential: "${credential.label}"`,
      ipAddress: `${ip} | UA: ${userAgent.substring(0, 120)}`,
    });

    return NextResponse.json({ success: true, data: { password: plaintext } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

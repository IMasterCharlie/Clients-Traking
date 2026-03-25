import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechAsset from '@/models/TechAsset';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const body = await req.json();
    const asset = await TechAsset.findOneAndUpdate(
      { projectId, userId: payload.userId },
      { $set: { github: body } },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

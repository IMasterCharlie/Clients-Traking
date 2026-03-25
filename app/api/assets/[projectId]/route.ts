import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechAsset from '@/models/TechAsset';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';

async function getUser(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return null;
  const { payload } = await verifyToken(token, 'access');
  return payload;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    await dbConnect();
    const payload = await getUser(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const asset = await TechAsset.findOne({ projectId, userId: payload.userId });
    return NextResponse.json({ success: true, data: asset || null });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    await dbConnect();
    const payload = await getUser(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: projectId, userId: payload.userId });
    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const existing = await TechAsset.findOne({ projectId, userId: payload.userId });
    if (existing) return NextResponse.json({ success: false, message: 'Asset record already exists' }, { status: 400 });

    const asset = await TechAsset.create({ projectId, userId: payload.userId });
    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

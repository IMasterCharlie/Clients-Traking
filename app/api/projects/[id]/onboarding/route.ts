import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { key, completed } = await req.json();
    if (!key) return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 });

    const update = completed
      ? { $addToSet: { onboardingDone: key } }
      : { $pull: { onboardingDone: key } };

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      update,
      { new: true }
    );

    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

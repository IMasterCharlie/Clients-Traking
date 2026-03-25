import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/jwt';
import { taskSchema } from '@/lib/validations/project';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  const { id, taskId } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = taskSchema.partial().parse(body);

    const task = await Task.findOneAndUpdate(
      { _id: taskId, projectId: id, userId: payload.userId },
      { $set: validated },
      { new: true }
    );

    if (!task) return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Validation error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  const { id, taskId } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const task = await Task.findOneAndDelete({ _id: taskId, projectId: id, userId: payload.userId });

    if (!task) return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

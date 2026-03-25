import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import TimeLog from '@/models/TimeLog';
import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/jwt';
import { updateProjectSchema } from '@/lib/validations/project';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOne({ _id: id, userId: payload.userId })
      .populate('clientId', 'name company email phone');

    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    const tasks = await Task.find({ projectId: id, userId: payload.userId }).sort({ order: 1 });
    const timelogs = await TimeLog.find({ projectId: id, userId: payload.userId }).sort({ date: -1 });
    const activityLogs = await ActivityLog.find({ projectId: id, userId: payload.userId }).sort({ createdAt: -1 }).limit(50);

    // Group tasks by status
    const tasks_grouped = {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      done: tasks.filter(t => t.status === 'done'),
    };

    // Calculate timelogs summary
    const timelogsSummary = timelogs.reduce((acc, log) => {
      acc.totalHours += log.hours;
      if (log.billable) {
        acc.billableHours += log.hours;
        if (!log.invoiceId) {
          acc.unbilledBillableHours += log.hours;
        }
      }
      return acc;
    }, { totalHours: 0, billableHours: 0, unbilledBillableHours: 0 });

    // Mock payments summary for now
    const paymentsSummary = {
      totalInvoiced: 0,
      totalPaid: 0,
      outstanding: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...project.toObject(),
        tasks,
        tasks_grouped,
        timelogs,
        timelogsSummary,
        activityLogs,
        paymentsSummary,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = updateProjectSchema.parse(body);

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: validated },
      { new: true }
    );

    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    // Log activity
    await ActivityLog.create({
      userId: payload.userId,
      projectId: id,
      action: 'PROJECT_UPDATE',
      description: `Project "${project.title}" updated.`,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Validation error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = await verifyToken(accessToken, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!project) return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });

    // Log activity
    await ActivityLog.create({
      userId: payload.userId,
      projectId: id,
      action: 'PROJECT_ARCHIVE',
      description: `Project "${project.title}" archived.`,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, message: 'Project archived' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

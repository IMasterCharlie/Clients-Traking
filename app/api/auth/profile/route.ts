import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/jwt';

// Allowed updatable fields (never allow passwordHash, role, twoFactor*, refreshToken)
const ALLOWED_FIELDS = [
  'name',
  'timezone',
  'defaultCurrency',
  'businessName',
  'businessAddress',
  'businessLogo',
  'defaultTaxRate',
  'notificationPrefs',
];

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Whitelist fields
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        // For notificationPrefs, merge with existing rather than replace entirely
        if (key === 'notificationPrefs') {
          const existing = await User.findById(payload.userId).select('notificationPrefs').lean() as any;
          update.notificationPrefs = { ...(existing?.notificationPrefs || {}), ...body.notificationPrefs };
        } else {
          update[key] = body[key];
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: update },
      { new: true }
    ).select('-passwordHash -twoFactorSecret -refreshToken');

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // Activity log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await ActivityLog.create({
      userId: payload.userId,
      action: 'UPDATE_PROFILE',
      description: `Profile updated: ${Object.keys(update).join(', ')}`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(payload.userId)
      .select('-passwordHash -twoFactorSecret -refreshToken')
      .lean();

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

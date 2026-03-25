import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload, error } = await verifyToken(accessToken, 'access');
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: error === 'ERR_JWT_EXPIRED' ? 'Token expired' : 'Invalid token' },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Old and new passwords are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PASSWORD', message: 'Invalid old password' },
        { status: 401 }
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.refreshToken = undefined; // Invalidate all refresh tokens
    await user.save();

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

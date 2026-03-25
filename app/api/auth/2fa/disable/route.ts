import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
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

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Password is required' },
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PASSWORD', message: 'Invalid password' },
        { status: 401 }
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return NextResponse.json(
      { success: true, message: '2FA disabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

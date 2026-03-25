import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
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

    const user = await User.findById(payload.userId).select('-passwordHash -twoFactorSecret -refreshToken');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { user }, message: 'User profile retrieved' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

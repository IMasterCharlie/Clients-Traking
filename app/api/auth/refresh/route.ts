import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, verifyToken, hashToken } from '@/lib/jwt';

function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60;
  const num = parseInt(match[1]);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 15 * 60;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const { payload, error } = await verifyToken(refreshToken, 'refresh');
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REFRESH_TOKEN', message: error === 'ERR_JWT_EXPIRED' ? 'Refresh token expired' : 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== await hashToken(refreshToken)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Rotate refresh token
    const newAccessToken = await signToken({ userId: user._id.toString(), role: user.role, email: user.email }, 'access', process.env.JWT_ACCESS_EXPIRES || '7d');
    const newRefreshToken = await signToken({ userId: user._id.toString() }, 'refresh', process.env.JWT_REFRESH_EXPIRES || '7d');

    user.refreshToken = await hashToken(newRefreshToken);
    await user.save();

    const response = NextResponse.json(
      { success: true, message: 'Token refreshed' },
      { status: 200 }
    );

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiryToSeconds(process.env.JWT_ACCESS_EXPIRES || '15m'),
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRES || '7d'),
    });

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

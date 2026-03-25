import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, hashToken } from '@/lib/jwt';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'User ID and code are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '2FA not enabled for this user' },
        { status: 401 }
      );
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE', message: 'Invalid verification code' },
        { status: 401 }
      );
    }

    const accessToken = await signToken({ userId: user._id, role: user.role, email: user.email }, 'access', process.env.JWT_ACCESS_EXPIRES || '15m');
    const refreshToken = await signToken({ userId: user._id }, 'refresh', process.env.JWT_REFRESH_EXPIRES || '7d');

    user.refreshToken = await hashToken(refreshToken);
    await user.save();

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        message: '2FA confirmed, login successful',
      },
      { status: 200 }
    );

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('2FA confirm error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

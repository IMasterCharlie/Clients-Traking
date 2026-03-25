import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { encrypt } from '@/lib/encryption';

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

    const { secret, code } = await req.json();
    if (!secret || !code) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Secret and code are required' },
        { status: 400 }
      );
    }

    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE', message: 'Invalid verification code' },
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

    user.twoFactorEnabled = true;
    user.twoFactorSecret = encrypt(secret);
    await user.save();

    return NextResponse.json(
      { success: true, message: '2FA enabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

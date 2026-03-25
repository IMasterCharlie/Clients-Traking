import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, hashToken } from '@/lib/jwt';

function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60; // fallback 15m
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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.twoFactorEnabled) {
      // Store temporary session or just return flag
      // For simplicity, we'll return a flag and the client will handle the next step
      return NextResponse.json(
        { success: true, data: { requires2FA: true, userId: user._id }, message: '2FA required' },
        { status: 200 }
      );
    }

    const accessToken = await signToken({ userId: user._id.toString(), role: user.role, email: user.email }, 'access', process.env.JWT_ACCESS_EXPIRES || '15m');
    const refreshToken = await signToken({ userId: user._id.toString() }, 'refresh', process.env.JWT_REFRESH_EXPIRES || '7d');

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
        message: 'Login successful',
      },
      { status: 200 }
    );

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiryToSeconds(process.env.JWT_ACCESS_EXPIRES || '15m'),
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRES || '7d'),
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
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

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'DevManager Pro', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Temporary store secret in session or just return it for verification
    // We'll return it so the client can send it back for verification
    return NextResponse.json(
      {
        success: true,
        data: {
          secret,
          qrCode: qrCodeDataUrl,
          otpauth,
        },
        message: '2FA setup initiated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

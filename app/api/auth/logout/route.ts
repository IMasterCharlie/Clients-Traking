import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      const { payload } = await verifyToken(refreshToken, 'refresh');
      if (payload) {
        const user = await User.findById(payload.userId);
        if (user) {
          user.refreshToken = undefined;
          await user.save();
        }
      }
    }

    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );

    response.cookies.set('access_token', '', { maxAge: 0 });
    response.cookies.set('refresh_token', '', { maxAge: 0 });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

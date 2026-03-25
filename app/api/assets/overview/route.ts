import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechAsset from '@/models/TechAsset';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { payload } = await verifyToken(token, 'access');
    if (!payload) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const projects = await Project.find({ userId: payload.userId })
      .populate('clientId', 'name company')
      .select('title color clientId status')
      .lean();

    const assets = await TechAsset.find({ userId: payload.userId })
      .select('projectId hosting.expiryDate domain.expiryDate ssl.expiryDate domain.domainName hosting.provider ssl.provider')
      .lean();

    const assetMap = new Map(assets.map((a) => [a.projectId.toString(), a]));

    const now = new Date();

    const rows = projects.map((p: any) => {
      const asset = assetMap.get(p._id.toString());
      return {
        projectId: p._id,
        title: p.title,
        color: p.color,
        status: p.status,
        client: p.clientId,
        hostingExpiry: asset?.hosting?.expiryDate || null,
        hostingProvider: asset?.hosting?.provider || null,
        domainExpiry: asset?.domain?.expiryDate || null,
        domainName: asset?.domain?.domainName || null,
        sslExpiry: asset?.ssl?.expiryDate || null,
        sslProvider: asset?.ssl?.provider || null,
      };
    });

    // Summary stats
    const getDaysLeft = (date: Date | null) => {
      if (!date) return null;
      return Math.floor((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const hostingDue = rows.filter((r) => {
      const d = getDaysLeft(r.hostingExpiry);
      return d !== null && d <= 30;
    }).length;
    const domainsDue = rows.filter((r) => {
      const d = getDaysLeft(r.domainExpiry);
      return d !== null && d <= 30;
    }).length;
    const sslDue = rows.filter((r) => {
      const d = getDaysLeft(r.sslExpiry);
      return d !== null && d <= 30;
    }).length;

    return NextResponse.json({
      success: true,
      data: { rows, summary: { hostingDue, domainsDue, sslDue } },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST /api/auth/switch-org — switch active org context, re-issue JWT
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import Membership from '@/src/models/Membership';
import Organization from '@/src/models/Organization';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await db;
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { success: false, message: 'orgId is required' },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await Membership.findOne({
      userId: user.id,
      organizationId: orgId,
      isActive: true,
    }).lean();

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    const org = await Organization.findOne({ _id: orgId, isDeleted: false })
      .select('name slug')
      .lean();

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Re-issue JWT with new currentOrgId
    const newToken = jwt.sign(
      { id: user.id, email: user.email, currentOrgId: orgId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Organization switched',
      data: { organization: org, role: membership.role },
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/switch-org]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

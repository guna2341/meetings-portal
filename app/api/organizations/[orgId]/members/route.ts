// GET    /api/organizations/[orgId]/members — list members
// DELETE /api/organizations/[orgId]/members?userId=xxx — remove a member
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireOrgMember, requireOrgRole } from '@/src/lib/auth';
import Membership from '@/src/models/Membership';
import { User } from '@/src/models/User';
import AuditLog from '@/src/models/AuditLog';
import mongoose from 'mongoose';

type Params = { params: Promise<{ orgId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const member = await requireOrgMember(req, orgId);
    if (member instanceof NextResponse) return member;

    const memberships = await Membership.find({
      organizationId: orgId,
      isActive: true,
    }).lean();

    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('-password')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const data = memberships.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: userMap.get(m.userId.toString()),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/organizations/[orgId]/members]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const actor = await requireOrgRole(req, orgId, 'admin');
    if (actor instanceof NextResponse) return actor;

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'userId query param required' },
        { status: 400 }
      );
    }

    // Cannot remove an owner
    const targetMembership = await Membership.findOne({
      userId: targetUserId,
      organizationId: orgId,
      isActive: true,
    });

    if (!targetMembership) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMembership.role === 'owner') {
      return NextResponse.json(
        { success: false, message: 'Cannot remove the organization owner' },
        { status: 400 }
      );
    }

    targetMembership.isActive = false;
    await targetMembership.save();

    await AuditLog.create({
      action: 'member.removed',
      actorId: new mongoose.Types.ObjectId(actor.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
      targetId: new mongoose.Types.ObjectId(targetUserId),
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('[DELETE /api/organizations/[orgId]/members]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

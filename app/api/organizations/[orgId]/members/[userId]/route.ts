// PATCH /api/organizations/[orgId]/members/[userId] — change a member's role
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireOrgRole } from '@/src/lib/auth';
import Membership from '@/src/models/Membership';
import AuditLog from '@/src/models/AuditLog';
import type { OrgRole } from '@/src/types/common';
import mongoose from 'mongoose';

type Params = { params: Promise<{ orgId: string; userId: string }> };

const VALID_ROLES: OrgRole[] = ['admin', 'member'];

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId, userId } = await params;

    // Only owners can change roles
    const actor = await requireOrgRole(req, orgId, 'owner');
    if (actor instanceof NextResponse) return actor;

    const body = await req.json();
    const { role } = body as { role: OrgRole };

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Cannot change owner's own role via this endpoint
    if (actor.userId === userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const membership = await Membership.findOneAndUpdate(
      { userId, organizationId: orgId, isActive: true },
      { $set: { role } },
      { new: true }
    );

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    await AuditLog.create({
      action: 'member.role_changed',
      actorId: new mongoose.Types.ObjectId(actor.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
      targetId: new mongoose.Types.ObjectId(userId),
      meta: { newRole: role },
    });

    return NextResponse.json({ success: true, data: membership });
  } catch (error) {
    console.error('[PATCH /api/organizations/[orgId]/members/[userId]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

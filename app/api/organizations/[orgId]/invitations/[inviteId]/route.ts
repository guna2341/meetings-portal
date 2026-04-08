// DELETE /api/organizations/[orgId]/invitations/[inviteId] — revoke invitation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireOrgRole } from '@/src/lib/auth';
import Invitation from '@/src/models/Invitation';
import AuditLog from '@/src/models/AuditLog';
import mongoose from 'mongoose';

type Params = { params: Promise<{ orgId: string; inviteId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId, inviteId } = await params;

    const actor = await requireOrgRole(req, orgId, 'admin');
    if (actor instanceof NextResponse) return actor;

    const invite = await Invitation.findOneAndUpdate(
      { _id: inviteId, organizationId: orgId, status: 'pending' },
      { $set: { status: 'revoked' } },
      { new: true }
    );

    if (!invite) {
      return NextResponse.json(
        { success: false, message: 'Pending invitation not found' },
        { status: 404 }
      );
    }

    await AuditLog.create({
      action: 'invite.revoked',
      actorId: new mongoose.Types.ObjectId(actor.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
      meta: { email: invite.email },
    });

    return NextResponse.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    console.error('[DELETE /api/organizations/[orgId]/invitations/[inviteId]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

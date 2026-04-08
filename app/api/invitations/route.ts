// GET /api/invitations — list all pending invitations for the logged-in user's email
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import Invitation from '@/src/models/Invitation';
import Organization from '@/src/models/Organization';
import { User } from '@/src/models/User';

export async function GET(req: NextRequest) {
  try {
    await db;
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    // Get the user's email from DB to be safe (not just JWT)
    const userDoc = await User.findById(user.id).select('email').lean();
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Mark expired invitations
    await Invitation.updateMany(
      { email: userDoc.email, status: 'pending', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

    const invitations = await Invitation.find({
      email: userDoc.email,
      status: 'pending',
    })
      .sort({ invitedAt: -1 })
      .lean();

    // Populate org names
    const orgIds = invitations.map((i) => i.organizationId);
    const orgs = await Organization.find({ _id: { $in: orgIds } })
      .select('name slug logo')
      .lean();
    const orgMap = new Map(orgs.map((o) => [o._id.toString(), o]));

    const data = invitations.map((inv) => ({
      ...inv,
      organization: orgMap.get(inv.organizationId.toString()),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/invitations]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

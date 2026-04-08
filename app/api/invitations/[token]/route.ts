// GET  /api/invitations/[token] — validate token and return invite details
// POST /api/invitations/[token] — accept or decline an invitation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import Invitation from '@/src/models/Invitation';
import Membership from '@/src/models/Membership';
import Organization from '@/src/models/Organization';
import AuditLog from '@/src/models/AuditLog';
import { User } from '@/src/models/User';
import { hashToken } from '@/src/lib/tokens';
import mongoose from 'mongoose';

type Params = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { token } = await params;
    const hashed = hashToken(token);

    const invite = await Invitation.findOne({ token: hashed }).lean();

    if (!invite) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Invitation is already ${invite.status}` },
        { status: 410 }
      );
    }

    if (new Date() > invite.expiresAt) {
      await Invitation.findByIdAndUpdate(invite._id, { status: 'expired' });
      return NextResponse.json(
        { success: false, message: 'Invitation has expired' },
        { status: 410 }
      );
    }

    const org = await Organization.findById(invite.organizationId)
      .select('name slug logo')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        organization: org,
      },
    });
  } catch (error) {
    console.error('[GET /api/invitations/[token]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { token } = await params;

    // Must be logged in to accept/decline
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const { action } = body as { action: 'accept' | 'decline' };

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json(
        { success: false, message: 'action must be accept or decline' },
        { status: 400 }
      );
    }

    const hashed = hashToken(token);
    const invite = await Invitation.findOne({ token: hashed });

    if (!invite || invite.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Invalid or already-used invitation' },
        { status: 410 }
      );
    }

    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return NextResponse.json(
        { success: false, message: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Validate email matches
    const userDoc = await User.findById(user.id).select('email').lean();
    if (!userDoc || userDoc.email !== invite.email) {
      return NextResponse.json(
        {
          success: false,
          message: 'This invitation was sent to a different email address',
        },
        { status: 403 }
      );
    }

    if (action === 'decline') {
      invite.status = 'declined';
      invite.respondedAt = new Date();
      await invite.save();

      await AuditLog.create({
        action: 'invite.declined',
        actorId: new mongoose.Types.ObjectId(user.id),
        organizationId: invite.organizationId,
        meta: { email: invite.email },
      });

      return NextResponse.json({ success: true, message: 'Invitation declined' });
    }

    // Accept: add membership (idempotent)
    const existing = await Membership.findOne({
      userId: user.id,
      organizationId: invite.organizationId,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.role = invite.role;
        await existing.save();
      }
    } else {
      await Membership.create({
        userId: new mongoose.Types.ObjectId(user.id),
        organizationId: invite.organizationId,
        role: invite.role,
      });
    }

    invite.status = 'accepted';
    invite.respondedAt = new Date();
    await invite.save();

    await AuditLog.create({
      action: 'invite.accepted',
      actorId: new mongoose.Types.ObjectId(user.id),
      organizationId: invite.organizationId,
      meta: { email: invite.email, role: invite.role },
    });

    const org = await Organization.findById(invite.organizationId)
      .select('name slug')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'You have joined the organization',
      data: { organization: org, role: invite.role },
    });
  } catch (error) {
    console.error('[POST /api/invitations/[token]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

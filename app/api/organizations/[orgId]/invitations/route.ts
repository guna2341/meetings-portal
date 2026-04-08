// GET  /api/organizations/[orgId]/invitations — list all invitations for org
// POST /api/organizations/[orgId]/invitations — send an invitation + email to Gmail
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireOrgRole } from '@/src/lib/auth';
import Invitation from '@/src/models/Invitation';
import Membership from '@/src/models/Membership';
import AuditLog from '@/src/models/AuditLog';
import Organization from '@/src/models/Organization';
import { generateInviteToken, hashToken, getInviteExpiry, buildInviteUrl } from '@/src/lib/tokens';
import { sendInvitationEmail } from '@/src/lib/email';
import type { OrgRole } from '@/src/types/common';
import mongoose from 'mongoose';

type Params = { params: Promise<{ orgId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const member = await requireOrgRole(req, orgId, 'admin');
    if (member instanceof NextResponse) return member;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    const invitations = await Invitation.find({ organizationId: orgId, status })
      .sort({ invitedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: invitations });
  } catch (error) {
    console.error('[GET /api/organizations/[orgId]/invitations]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const actor = await requireOrgRole(req, orgId, 'admin');
    if (actor instanceof NextResponse) return actor;

    const body = await req.json();
    const { email, role = 'member' } = body as { email: string; role?: OrgRole };

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Guard: email already a member? ────────────────────────────────────────
    const { User } = await import('@/src/models/User');
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      const alreadyMember = await Membership.exists({
        userId: existingUser._id,
        organizationId: orgId,
        isActive: true,
      });
      if (alreadyMember) {
        return NextResponse.json(
          { success: false, message: 'This user is already a member of the organization' },
          { status: 409 }
        );
      }
    }

    // ── Guard: pending invite already exists? ─────────────────────────────────
    const existingInvite = await Invitation.findOne({
      email: normalizedEmail,
      organizationId: orgId,
      status: 'pending',
    });
    if (existingInvite) {
      return NextResponse.json(
        { success: false, message: 'A pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // ── Generate token & save invitation ──────────────────────────────────────
    const rawToken = generateInviteToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = getInviteExpiry();

    await Invitation.create({
      email: normalizedEmail,
      organizationId: new mongoose.Types.ObjectId(orgId),
      role,
      token: hashedToken,
      expiresAt,
      invitedBy: new mongoose.Types.ObjectId(actor.userId),
    });

    await AuditLog.create({
      action: 'invite.sent',
      actorId: new mongoose.Types.ObjectId(actor.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
      meta: { email: normalizedEmail, role },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const inviteUrl = buildInviteUrl(rawToken, baseUrl);

    // ── Load org + actor details for email ────────────────────────────────────
    const [org, actorUser] = await Promise.all([
      Organization.findById(orgId).lean(),
      User.findById(actor.userId).select('name email').lean(),
    ]);

    // ── Send email to invitee's Gmail inbox ───────────────────────────────────
    let emailSent = false;
    let emailError: string | undefined;

    try {
      await sendInvitationEmail({
        to: normalizedEmail,
        inviteUrl,
        orgName: org?.name ?? 'the organization',
        role,
        invitedByName: actorUser?.name || actorUser?.email || 'A team member',
        expiresAt,
      });
      emailSent = true;
    } catch (err) {
      // Email failure should NOT block the invitation creation
      // The invite link is still usable manually
      console.error('[sendInvitationEmail] Failed:', err);
      emailError = err instanceof Error ? err.message : 'Email delivery failed';
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? `Invitation sent to ${normalizedEmail}`
          : `Invitation created (email delivery failed — share the link manually)`,
        data: {
          email: normalizedEmail,
          role,
          expiresAt,
          inviteUrl,
          orgName: org?.name,
          emailSent,
          ...(emailError && { emailError }),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/organizations/[orgId]/invitations]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

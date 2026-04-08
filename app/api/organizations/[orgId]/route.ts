// GET   /api/organizations/[orgId] — get org details
// PATCH /api/organizations/[orgId] — update org (admin+)
// DELETE /api/organizations/[orgId] — soft-delete org (owner only)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireOrgMember, requireOrgRole } from '@/src/lib/auth';
import Organization from '@/src/models/Organization';
import AuditLog from '@/src/models/AuditLog';
import mongoose from 'mongoose';

type Params = { params: Promise<{ orgId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const member = await requireOrgMember(req, orgId);
    if (member instanceof NextResponse) return member;

    const org = await Organization.findOne({ _id: orgId, isDeleted: false }).lean();
    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { ...org, role: member.role } });
  } catch (error) {
    console.error('[GET /api/organizations/[orgId]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await db;
    const { orgId } = await params;

    const member = await requireOrgRole(req, orgId, 'admin');
    if (member instanceof NextResponse) return member;

    const body = await req.json();
    const { name, description, logo } = body;

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (logo !== undefined) updates.logo = logo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    const org = await Organization.findOneAndUpdate(
      { _id: orgId, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    await AuditLog.create({
      action: 'org.updated',
      actorId: new mongoose.Types.ObjectId(member.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
      meta: updates,
    });

    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    console.error('[PATCH /api/organizations/[orgId]]', error);
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

    const member = await requireOrgRole(req, orgId, 'owner');
    if (member instanceof NextResponse) return member;

    const org = await Organization.findOneAndUpdate(
      { _id: orgId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    await AuditLog.create({
      action: 'org.deleted',
      actorId: new mongoose.Types.ObjectId(member.userId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    return NextResponse.json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    console.error('[DELETE /api/organizations/[orgId]]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

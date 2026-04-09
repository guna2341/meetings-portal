// GET  /api/organizations — list orgs the current user belongs to
// POST /api/organizations — create a new organization
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import Organization from '@/src/models/Organization';
import Membership from '@/src/models/Membership';
import AuditLog from '@/src/models/AuditLog';
import mongoose from 'mongoose';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await Organization.exists({ slug })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function GET(req: NextRequest) {
  try {
    await db;
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    // Find all active memberships for this user
    const memberships = await Membership.find({
      userId: user.id,
      isActive: true,
    }).lean();

    const orgIds = memberships.map((m) => m.organizationId);

    const orgs = await Organization.find({
      _id: { $in: orgIds },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Attach role to each org
    const membershipMap = new Map(
      memberships.map((m) => [m.organizationId.toString(), m.role])
    );

    const data = orgs.map((o) => ({
      ...o,
      role: membershipMap.get(o._id.toString()),
    }));

    return NextResponse.json({ 
      success: true, 
      data,
      activeOrgId: user.currentOrgId || null 
    });
  } catch (error) {
    console.error('[GET /api/organizations]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await db;
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const { name, description, logo } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Organization name is required' },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(slugify(name.trim()));

    const session = await mongoose.startSession();
    let org: InstanceType<typeof Organization> | null = null;

    await session.withTransaction(async () => {
      const [created] = await Organization.create(
        [
          {
            name: name.trim(),
            slug,
            description: description?.trim(),
            logo,
            createdBy: new mongoose.Types.ObjectId(user.id),
          },
        ],
        { session }
      );
      org = created;

      await Membership.create(
        [
          {
            userId: new mongoose.Types.ObjectId(user.id),
            organizationId: org._id,
            role: 'owner',
          },
        ],
        { session }
      );

      await AuditLog.create(
        [
          {
            action: 'org.created',
            actorId: new mongoose.Types.ObjectId(user.id),
            organizationId: org._id,
            meta: { name: org.name, slug: org.slug },
          },
        ],
        { session }
      );
    });

    session.endSession();

    return NextResponse.json(
      { success: true, message: 'Organization created', data: org },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/organizations]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

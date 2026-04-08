// GET /api/users — List users, optionally scoped to an organization
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { User } from "@/src/models/User";
import Membership from "@/src/models/Membership";
import { requireAuth } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const orgId = searchParams.get("orgId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const skip = (page - 1) * limit;

    let userIds: string[] | null = null;

    // If orgId provided, restrict to members of that org only
    if (orgId) {
      // Verify requester is a member of that org
      const requesterMembership = await Membership.findOne({
        userId: user.id,
        organizationId: orgId,
        isActive: true,
      }).lean();

      if (!requesterMembership) {
        return NextResponse.json(
          { success: false, message: "You are not a member of this organization" },
          { status: 403 }
        );
      }

      const memberships = await Membership.find({
        organizationId: orgId,
        isActive: true,
      })
        .select("userId")
        .lean();

      userIds = memberships.map((m) => m.userId.toString());
    }

    const filter: Record<string, unknown> = {};

    if (userIds !== null) {
      filter._id = { $in: userIds };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
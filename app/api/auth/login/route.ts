import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@/src/models/User";
import Membership from "@/src/models/Membership";
import Invitation from "@/src/models/Invitation";
import Organization from "@/src/models/Organization";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await db;

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Load org memberships
    const memberships = await Membership.find({
      userId: user._id,
      isActive: true,
    }).lean();

    const orgIds = memberships.map((m) => m.organizationId);
    const organizations = await Organization.find({
      _id: { $in: orgIds },
      isDeleted: false,
    })
      .select("name slug logo")
      .lean();

    // Determine active org: use stored currentOrgId if still valid, else first org
    const validOrgIds = new Set(organizations.map((o) => o._id.toString()));
    let currentOrgId: string | undefined;
    if (user.currentOrgId && validOrgIds.has(user.currentOrgId)) {
      currentOrgId = user.currentOrgId;
    } else if (organizations.length > 0) {
      currentOrgId = organizations[0]._id.toString();
    }

    // Auto-expire stale invitations for this user's email
    await Invitation.updateMany(
      { email: user.email, status: "pending", expiresAt: { $lt: new Date() } },
      { $set: { status: "expired" } }
    );

    const pendingInvitesCount = await Invitation.countDocuments({
      email: user.email,
      status: "pending",
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, currentOrgId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentOrgId,
        organizations,
        pendingInvitesCount,
        hasOrganizations: organizations.length > 0,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    console.error("[POST /api/auth/login]", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { User } from "@/src/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper to get user email from JWT
function getUserEmailFromRequest(req: NextRequest): string | null {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
    return decoded.email;
  } catch {
    return null;
  }
}

// GET: Fetch the current user's profile
export async function GET(req: NextRequest) {
  try {
    await db;

    const email = getUserEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email } as any).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update the current user's profile
export async function PUT(req: NextRequest) {
  try {
    await db;

    const email = getUserEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    const user = await User.findOne({ email } as any);
    // Keep user checking
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let updates: any = {};

    if (name) {
      updates.name = name;
    }

    // If attempting to update password
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
         return NextResponse.json({ success: false, message: "Incorrect current password" }, { status: 400 });
      }
      
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, message: "New password must be at least 8 characters long" }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // Only update if there's something to update
    if (Object.keys(updates).length > 0) {
        await User.updateOne({ email } as any, { $set: updates });
    }

    // Fetch the updated user data to return
    const updatedUser = await User.findOne({ email } as any).select("-password").lean();

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[PUT /api/profile]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

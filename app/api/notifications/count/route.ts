import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserFromRequest(req: NextRequest): { id: string; email: string } | null {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const pendingInvitations = await Meeting.find({
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "pending" } } },
        { "attendees": { $elemMatch: { email: user.email, status: "pending" } } }
      ]
    }).sort({ date: 1, time: 1 }).lean();

    return NextResponse.json({
      success: true,
      pendingCount: pendingInvitations.length,
      pendingInvitations
    });

  } catch (error) {
    console.error("[GET /api/notifications/count]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

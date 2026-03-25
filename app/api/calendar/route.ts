import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserFromRequest(req: NextRequest): { id: string; email: string; name?: string } | null {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name?: string };
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

    // Hosted meetings
    const hostedMeetings = await Meeting.find({
      $or: [
        { "organizer.userId": user.id },
        { "organizer.email": user.email }
      ]
    }).lean();

    // Invited meetings (Accepted only)
    const invitedMeetings = await Meeting.find({
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "accepted" } } },
        { "attendees": { $elemMatch: { email: user.email, status: "accepted" } } }
      ]
    }).lean();

    const allMeetings = [...hostedMeetings, ...invitedMeetings];
    
    // Deduplicate in case organizer and attendee match
    const uniqueMeetingsMap = new Map();
    allMeetings.forEach(m => uniqueMeetingsMap.set(m._id.toString(), m));
    
    return NextResponse.json({
      success: true,
      data: Array.from(uniqueMeetingsMap.values())
    });

  } catch (error) {
    console.error("[GET /api/calendar]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

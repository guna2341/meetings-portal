import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

import { requireAuth } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json({ success: false, message: "No active organization selected" }, { status: 400 });
    }

    // Hosted meetings
    const hostedMeetings = await Meeting.find({
      organizationId: user.currentOrgId,
      $or: [
        { "organizer.userId": user.id },
        { "organizer.email": user.email }
      ]
    }).lean();

    // Invited meetings (Accepted only)
    const invitedMeetings = await Meeting.find({
      organizationId: user.currentOrgId,
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

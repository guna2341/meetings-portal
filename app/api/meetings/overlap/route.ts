import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";
import { getMeetingTimeRange, areRangesOverlapping } from "@/src/utils/time";

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

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get("meetingId");

    if (!meetingId) {
      return NextResponse.json({ success: false, message: "Meeting ID is required" }, { status: 400 });
    }

    // 1. Get the target meeting
    const targetMeeting = await Meeting.findById(meetingId).lean();
    if (!targetMeeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 });
    }

    const targetRange = getMeetingTimeRange(targetMeeting.date, targetMeeting.time, targetMeeting.duration);
    if (!targetRange) {
      return NextResponse.json({ success: false, message: "Invalid meeting time format" }, { status: 400 });
    }

    // 2. Find all other meetings where user is an attendee and status is 'accepted'
    const acceptedMeetings = await Meeting.find({
      _id: { $ne: meetingId },
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "accepted" } } },
        { "organizer.userId": user.id } // Organizer is always "accepted"
      ],
      date: targetMeeting.date // Optimization: only same day
    }).lean();

    // 3. Check for overlaps
    const conflicts = acceptedMeetings.filter(m => {
      const range = getMeetingTimeRange(m.date, m.time, m.duration);
      if (!range) return false;
      return areRangesOverlapping(targetRange.start, targetRange.end, range.start, range.end);
    }).map(m => ({
      _id: m._id,
      title: m.title,
      time: m.time,
      duration: m.duration
    }));

    return NextResponse.json({
      success: true,
      hasOverlap: conflicts.length > 0,
      conflicts
    });

  } catch (error) {
    console.error("[GET /api/meetings/overlap]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

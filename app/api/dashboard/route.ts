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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Counts
    const [hostedCount, invitedCount, todayCount] = await Promise.all([
      Meeting.countDocuments({ "organizer.userId": user.id }),
      Meeting.countDocuments({ "attendees.email": user.email }),
      Meeting.countDocuments({
        $or: [
          { "organizer.userId": user.id },
          { "attendees.email": user.email }
        ],
        date: { $gte: today, $lt: tomorrow }
      })
    ]);

    // 2. Today's Meetings
    const todayMeetings = await Meeting.find({
      $or: [
        { "organizer.userId": user.id },
        { "attendees.email": user.email }
      ],
      date: { $gte: today, $lt: tomorrow }
    }).sort({ time: 1 }).lean();

    // 3. Hosted Meetings (Upcoming/Recent)
    const hostedMeetings = await Meeting.find({ "organizer.userId": user.id })
      .sort({ date: -1, time: -1 })
      .limit(10)
      .lean();

    // 4. Invited Meetings (Upcoming/Recent)
    const invitedMeetings = await Meeting.find({ "attendees.email": user.email })
      .sort({ date: -1, time: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          hostedCount,
          invitedCount,
          todayCount
        },
        todayMeetings,
        hostedMeetings,
        invitedMeetings
      }
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

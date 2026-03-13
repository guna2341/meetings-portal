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

    const userFilter = {
      $or: [
        { "organizer.userId": user.id },
        { "organizer.email": user.email },
        { "attendees.userId": user.id },
        { "attendees.email": user.email }
      ]
    };

    // 1. Counts
    const [hostedCount, invitedCount, todayCount] = await Promise.all([
      Meeting.countDocuments({ 
        $or: [
          { "organizer.userId": user.id },
          { "organizer.email": user.email }
        ]
      }),
      Meeting.countDocuments({ 
        $or: [
          { "attendees.userId": user.id },
          { "attendees.email": user.email }
        ]
      }),
      Meeting.countDocuments({
        ...userFilter,
        date: { $gte: today, $lt: tomorrow }
      })
    ]);

    // 2. Today's Meetings (Logic moved to step 6)

    // 3. Hosted Meetings (Upcoming/Recent)
    const hostedMeetings = await Meeting.find({ 
      $or: [
        { "organizer.userId": user.id },
        { "organizer.email": user.email }
      ]
    })
      .sort({ date: -1, time: -1 })
      .limit(10)
      .lean();

    // 4. Invited Meetings (Accepted only)
    const invitedMeetings = await Meeting.find({ 
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "accepted" } } },
        { "attendees": { $elemMatch: { email: user.email, status: "accepted" } } }
      ]
    })
      .sort({ date: -1, time: -1 })
      .limit(10)
      .lean();

    // 5. Pending Invitations
    const pendingInvitations = await Meeting.find({
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "pending" } } },
        { "attendees": { $elemMatch: { email: user.email, status: "pending" } } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // 6. Today's Meetings (Only if accepted or hosted)
    const todayMeetings = await Meeting.find({
      $and: [
        { date: { $gte: today, $lt: tomorrow } },
        {
          $or: [
            { "organizer.userId": user.id },
            { "organizer.email": user.email },
            { "attendees": { $elemMatch: { userId: user.id, status: "accepted" } } },
            { "attendees": { $elemMatch: { email: user.email, status: "accepted" } } }
          ]
        }
      ]
    }).sort({ time: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          hostedCount,
          invitedCount,
          todayCount: todayMeetings.length,
          pendingCount: pendingInvitations.length
        },
        todayMeetings,
        hostedMeetings,
        invitedMeetings,
        pendingInvitations
      }
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";
import { requireAuth } from "@/src/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Dashboard API handler using requireAuth helper

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json({ success: false, message: "No active organization selected" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const userFilter = {
      organizationId: user.currentOrgId,
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
        organizationId: user.currentOrgId,
        $or: [
          { "organizer.userId": user.id },
          { "organizer.email": user.email }
        ]
      }),
      Meeting.countDocuments({ 
        organizationId: user.currentOrgId,
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
      organizationId: user.currentOrgId,
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
      organizationId: user.currentOrgId,
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
      organizationId: user.currentOrgId,
      $or: [
        { "attendees": { $elemMatch: { userId: user.id, status: "pending" } } },
        { "attendees": { $elemMatch: { email: user.email, status: "pending" } } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // 6. Today's Meetings (Only if accepted or hosted, and filtered by CURRENT org)
    const todayMeetings = await Meeting.find({
      $and: [
        { organizationId: user.currentOrgId },
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

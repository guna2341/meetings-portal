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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Await the params Promise
) {
  try {
    await db;

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
        return NextResponse.json({ success: false, message: "Meeting ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['accepted', 'declined'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Must be 'accepted' or 'declined'" },
        { status: 400 }
      );
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return NextResponse.json({ success: false, message: "Meeting not found" }, { status: 404 });
    }

    // Find the attendee dynamically by email or id
    const attendeeIndex = meeting.attendees.findIndex(
      (a: any) => a.userId === user.id || a.email === user.email
    );

    if (attendeeIndex === -1) {
      return NextResponse.json(
        { success: false, message: "You are not invited to this meeting" },
        { status: 403 }
      );
    }

    // Update status
    meeting.attendees[attendeeIndex].status = action as 'accepted' | 'declined';
    await meeting.save();

    return NextResponse.json({
      success: true,
      data: meeting,
      message: `Meeting successfully ${action}`,
    });
  } catch (error) {
    console.error("[POST /api/meetings/[id]/rsvp]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

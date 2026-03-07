import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status");
    const meetingId = searchParams.get("meetingId");

    const meetingFilter: Record<string, unknown> = {
      "organizer.userId": user.id,  // ← was "organizer.id", now matches schema
      "tasks.0": { $exists: true }, // meeting has at least one task
    };

    if (meetingId) meetingFilter["_id"] = new mongoose.Types.ObjectId(meetingId);

    const meetings = await Meeting.find(meetingFilter)
      .select("title date tasks organizer")
      .lean();

    // Flatten — keep only tasks assigned to someone other than the organizer
    const tasks = meetings.flatMap((meeting: any) =>
      (meeting.tasks as any[])
        .filter((task) => {
          const assignedTo    = task.assignedTo?.toString();
          const notSelf       = assignedTo !== user.id;
          const matchesStatus = status ? task.status === status : true;
          return notSelf && matchesStatus;
        })
        .map((task) => ({
          _id:          task._id,
          title:        task.title,
          assignedTo:   task.assignedTo,
          dueDate:      task.dueDate,
          status:       task.status,
          priority:     task.priority,
          meetingId:    meeting._id,
          meetingTitle: meeting.title,
          meetingDate:  meeting.date,
        }))
    );

    return NextResponse.json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
      total: tasks.length,
    });
  } catch (error: unknown) {
    console.error("[GET /api/tasks/assigned-by-me]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
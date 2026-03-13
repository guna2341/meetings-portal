import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";

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

const PatchSchema = z.object({
  status: z.enum(["pending", "in-progress", "completed"]),
});

// PATCH /api/meetings/[meetingId]/tasks/[taskId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await db;

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, taskId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, message: "Invalid meetingId or taskId" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(user.id);
    const { status }   = parsed.data;

    // Find the meeting and verify the requester is either the assignee or the organizer
    const query = {
      _id:               new mongoose.Types.ObjectId(id),
      "tasks._id":       new mongoose.Types.ObjectId(taskId),
      $or: [
        { "tasks.assignedTo": userObjectId },
        { "organizer.userId": user.id }
      ]
    };

    const meeting = await Meeting.findOne(query);

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Update the specific task's status using positional $ operator
    const updated = await Meeting.findOneAndUpdate(
      query,
      {
        $set: { "tasks.$.status": status },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update task" },
        { status: 500 }
      );
    }

    // Return just the updated task
    const updatedTask = (updated.tasks as any[]).find(
      (t) => t._id.toString() === taskId
    );

    return NextResponse.json({
      success: true,
      message: "Task status updated",
      data: updatedTask,
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/meetings/[meetingId]/tasks/[taskId]]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
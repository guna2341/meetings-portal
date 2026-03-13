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

    const userObjectId = new mongoose.Types.ObjectId(user.id);

    const pipeline: any[] = [
      // 1. Match meetings where the user is the organizer and tasks exist
      {
        $match: {
          "organizer.userId": user.id,
          "tasks.0": { $exists: true },
          ...(meetingId ? { _id: new mongoose.Types.ObjectId(meetingId) } : {}),
        }
      },

      // 2. Unwind tasks to process them individually
      { $unwind: "$tasks" },

      // 3. Filter tasks: Not self-assigned, and match status if provided
      {
        $match: {
          "tasks.assignedTo": { $ne: userObjectId },
          ...(status ? { "tasks.status": status } : {}),
        }
      },

      // 4. Join with attendees to check if the assignee has declined
      {
        $addFields: {
          assigneeStatus: {
            $filter: {
              input: "$attendees",
              as: "a",
              cond: { $eq: ["$$a.userId", "$tasks.assignedTo"] }
            }
          }
        }
      },
      {
        $match: {
          "assigneeStatus.status": { $ne: "declined" }
        }
      },

      // 5. Lookup assignee name from users collection
      {
        $lookup: {
          from: "users",
          localField: "tasks.assignedTo",
          foreignField: "_id",
          as: "assigneeInfo"
        }
      },

      // 6. Project final shape
      {
        $project: {
          _id:          "$tasks._id",
          title:        "$tasks.title",
          assignedTo:   "$tasks.assignedTo",
          assignedToName: { 
            $ifNull: [
              { $arrayElemAt: ["$assigneeInfo.name", 0] },
              "Unknown"
            ]
          },
          dueDate:      "$tasks.dueDate",
          status:       "$tasks.status",
          priority:     "$tasks.priority",
          meetingId:    "$_id",
          meetingTitle: "$title",
          meetingDate:  "$date",
        }
      },
      
      // 7. Sort by due date
      { $sort: { dueDate: 1 } }
    ];

    const tasks = await Meeting.aggregate(pipeline);

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
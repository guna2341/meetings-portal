import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db;

    const { searchParams } = new URL(req.url);
    const p = await params;

    const userId   = p.id;
    const status   = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip     = (page - 1) * limit;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Valid userId is required" },
        { status: 400 }
      );
    }

    // ← Cast to ObjectId — tasks.assignedTo is stored as ObjectId in the DB,
    //   so matching against a plain string will always return 0 results.
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Meeting.aggregate([
      // 1. Pre-filter meetings that have at least one task assigned to this user
      { $match: { "tasks.assignedTo": userObjectId } },

      // 2. Flatten tasks array
      { $unwind: "$tasks" },

      // 3. Keep only tasks assigned to this user + optional filters
      {
        $match: {
          "tasks.assignedTo": userObjectId,
          ...(status   ? { "tasks.status":   status   } : {}),
          ...(priority ? { "tasks.priority": priority } : {}),
        },
      },

      // 4. Shape output — pull meeting context alongside task fields
      {
        $project: {
          _id:           "$tasks._id",
          title:         "$tasks.title",
          assignedTo:    "$tasks.assignedTo",
          dueDate:       "$tasks.dueDate",
          status:        "$tasks.status",
          priority:      "$tasks.priority",
          meetingId:     "$_id",
          meetingTitle:  "$title",
          meetingDate:   "$date",
          meetingStatus: "$status",
        },
      },

      // 5. Add sort order for priority
      {
        $addFields: {
          priorityOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "high"]   }, then: 1 },
                { case: { $eq: ["$priority", "medium"] }, then: 2 },
                { case: { $eq: ["$priority", "low"]    }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },

      // 6. Sort by due date first, then priority
      { $sort: { dueDate: 1, priorityOrder: 1 } },

      // 7. Paginate
      {
        $facet: {
          data:  [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const data  = result[0]?.data          ?? [];
    const total = result[0]?.total[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/tasks]", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
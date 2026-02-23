// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";

export async function GET(req: NextRequest) {
  try {
    await db;

    const { searchParams } = new URL(req.url);

    const userId   = searchParams.get("userId");
    const status   = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip     = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    const result = await Meeting.aggregate([
      { $match: { "tasks.assignedTo": userId } },

      { $unwind: "$tasks" },

      {
        $match: {
          "tasks.assignedTo": userId,
          ...(status   ? { "tasks.status":   status   } : {}),
          ...(priority ? { "tasks.priority": priority } : {}),
        },
      },

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

      { $sort: { dueDate: 1, priorityOrder: 1 } },

      {
        $facet: {
          data:  [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const data  = result[0]?.data  ?? [];
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
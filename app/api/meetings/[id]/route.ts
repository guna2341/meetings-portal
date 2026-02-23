import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import mongoose from "mongoose";

type Params = { params: { id: string } };

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── GET /api/meetings/[id] ────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { success: false, message: "Invalid meeting ID" },
      { status: 400 }
    );
  }

  try {
    await db;

    const meeting = await Meeting.findById(params.id).lean();

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    console.error("[GET /api/meetings/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/meetings/[id] ────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { success: false, message: "Invalid meeting ID" },
      { status: 400 }
    );
  }

  try {
    await db;

    const body = await req.json();

    // Convert date strings to Date objects if present
    if (body.date) body.date = new Date(body.date);
    if (body.tasks) {
      body.tasks = body.tasks.map((t: { dueDate?: string }) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      }));
    }

    const meeting = await Meeting.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Meeting updated successfully",
      data: meeting,
    });
  } catch (error: unknown) {
    console.error("[PUT /api/meetings/[id]]", error);

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

// ─── DELETE /api/meetings/[id] ─────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { success: false, message: "Invalid meeting ID" },
      { status: 400 }
    );
  }

  try {
    await db;

    const meeting = await Meeting.findByIdAndDelete(params.id);

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/meetings/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
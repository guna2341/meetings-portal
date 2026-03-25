import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import mongoose from "mongoose";
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

type Params = { params: Promise<{ id: string }> };



// ─── GET /api/meetings/[id] ────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await db;

    const meeting = await Meeting.findById(id).lean();

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
  const { id } = await params;

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
      id,
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await db;

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }
    
    // Check if user is organizer
    const isOrganizer = meeting.organizer?.userId === user.id || meeting.organizer?.email === user.email;
    
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, message: "Only the meeting organizer can delete this meeting" },
        { status: 403 }
      );
    }

    await Meeting.findByIdAndDelete(id);

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
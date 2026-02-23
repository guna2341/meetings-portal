import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import { z } from "zod";

// ─── Zod validation schema ─────────────────────────────────────────────────

const AttendeeSchema = z.object({
  name: z.string().min(1, "Attendee name is required"),
  email: z.string().email("Invalid attendee email"),
  status: z.enum(["accepted", "declined", "pending"]).default("pending"),
});

const TaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  assignedTo: z.string().min(1, "Task must be assigned to someone"),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid due date"),
  status: z.enum(["completed", "in-progress", "pending"]).default("pending"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

const NoteSchema = z.object({
  author: z.string().min(1, "Note author is required"),
  content: z.string().min(1, "Note content is required"),
  timestamp: z.string().optional(),
});

const CreateMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid meeting date"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().default("60 min"),
  location: z.string().optional(),
  building: z.string().optional(),
  status: z.enum(["upcoming", "completed", "cancelled"]).default("upcoming"),
  organizer: z.object({
    name: z.string().min(1, "Organizer name is required"),
    email: z.string().email("Invalid organizer email"),
  }),
  attendees: z.array(AttendeeSchema).default([]),
  agenda: z.array(z.string()).default([]),
  tasks: z.array(TaskSchema).default([]),
  notes: z.array(NoteSchema).default([]),
});

// ─── POST /api/meetings — Create a meeting ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // db import ensures connection is established before any query
    await db;

    const body = await req.json();

    const parsed = CreateMeetingSchema.safeParse(body);
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

    const data = parsed.data;

    const meeting = await Meeting.create({
      ...data,
      date: new Date(data.date),
      tasks: data.tasks.map((t) => ({
        ...t,
        dueDate: new Date(t.dueDate),
      })),
      notes: data.notes.map((n) => ({
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
      })),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting created successfully",
        data: meeting.toJSON(),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/meetings]", error);

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

// ─── GET /api/meetings — List meetings ─────────────────────────────────────

// ─── GET /api/meetings — List all meetings ───────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await db;

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const organizerEmail = searchParams.get("organizer");
    const search = searchParams.get("search"); // search by title
    const fromDate = searchParams.get("from"); // filter from date
    const toDate = searchParams.get("to"); // filter to date
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (organizerEmail) filter["organizer.email"] = organizerEmail;
    if (search) filter.title = { $regex: search, $options: "i" };
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) (filter.date as Record<string, unknown>).$gte = new Date(fromDate);
      if (toDate) (filter.date as Record<string, unknown>).$lte = new Date(toDate);
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Meeting.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/meetings]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
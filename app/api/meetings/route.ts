import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Meeting from "@/src/models/meeting";
import Conversation from "@/src/models/Conversation";
import { User } from "@/src/models/User";
import { z } from "zod";
import { requireAuth } from "@/src/lib/auth";

// Remove duplicate local helper — use requireAuth from src/lib/auth

// ─── Zod validation schema ─────────────────────────────────────────────────

const AttendeeSchema = z.object({
  userId: z.string().optional(),
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
  meetingLink: z.string().optional().or(z.literal("")),
  meetingType: z.enum(["online", "offline", "hybrid"]).default("offline"),
  status: z.enum(["upcoming", "completed", "cancelled"]).default("upcoming"),
  // organizer is derived from JWT — not trusted from body
  attendees: z.array(AttendeeSchema).default([]),
  agenda: z.array(z.string()).default([]),
  tasks: z.array(TaskSchema).default([]),
  notes: z.array(NoteSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.meetingType === 'offline' && !data.location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Location is required for offline meetings",
      path: ["location"],
    });
  }
  if (data.meetingType === 'hybrid') {
    if (!data.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location is required for hybrid meetings",
        path: ["location"],
      });
    }
  }
});

// ─── POST /api/meetings — Create a meeting ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await db;

    // ── Require auth ──
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json(
        { success: false, message: "No active organization selected" },
        { status: 400 }
      );
    }

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
      organizationId: user.currentOrgId,
      date: new Date(data.date),
      meetingLink: data.meetingLink || undefined,

      // ── Build organizer from the verified JWT so ID is always present ──
      organizer: {
        userId: user.id,                           // ← was missing before
        email: user.email,
        name:  body.organizer?.name ?? "",
      },

      // ── Preserve attendee IDs if the client supplied them ─────────────
      attendees: data.attendees.map((a) => ({
        ...a,
        userId: a.userId ?? "",                           // ← was id before
      })),

      tasks: data.tasks.map((t) => ({
        ...t,
        dueDate: new Date(t.dueDate),
      })),

      notes: data.notes.map((n) => ({
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
      })),
    });

    // ── Create Automatic Group Chat ──
    try {
      // Find all attendee user IDs (only for those already registered)
      const attendeeEmails = data.attendees.map(a => a.email);
      // Use any to bypass weird lint on filter
      const attendeeUsers = await User.find({ email: { $in: attendeeEmails } } as any, '_id');
      const attendeeIds = attendeeUsers.map(u => u._id);

      // Create the group conversation
      await Conversation.create({
        type: 'group',
        meetingId: meeting._id,
        organizationId: user.currentOrgId,
        participants: [user.id, ...attendeeIds],
      });
    } catch (chatError) {
      console.error("[POST /api/meetings] Chat creation failed:", chatError);
      // We don't fail the meeting creation if chat fails
    }

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

// ─── GET /api/meetings — List meetings for the current user ────────────────

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json(
        { success: false, message: "No active organization selected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");
    const search   = searchParams.get("search");
    const fromDate = searchParams.get("from");
    const toDate   = searchParams.get("to");
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const skip     = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: user.currentOrgId,
      $or: [
        { "organizer.userId": user.id },    // created by me (ID match)
        { "organizer.email":  user.email }, // created by me (email fallback)
        { "attendees.userId": user.id },    // invited to (ID match)
        { "attendees.email":  user.email }, // invited to (email fallback)
      ],
    };

    if (status) filter.status = status;
    if (search) filter.title  = { $regex: search, $options: "i" };

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) (filter.date as Record<string, unknown>).$gte = new Date(fromDate);
      if (toDate)   (filter.date as Record<string, unknown>).$lte = new Date(toDate);
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Meeting.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages:  Math.ceil(total / limit),
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
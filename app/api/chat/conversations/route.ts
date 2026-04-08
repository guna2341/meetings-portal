import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Conversation from "@/src/models/Conversation";
import Message from "@/src/models/Message";
import { User } from "@/src/models/User";
import Meeting from "@/src/models/meeting";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(req: NextRequest) {
  try {
    await db;

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Fetch all conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: decoded.id,
    })
      .populate("participants", "name email")
      .populate("meetingId", "title")
      .sort({ updatedAt: -1 })
      .lean();

    // Enrich conversations with other participant's info and unread count
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findById(conv.lastMessage).lean();
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          readBy: { $ne: decoded.id },
        });

        return {
          ...conv,
          lastMessage: lastMessage ? (lastMessage as any).content : "",
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedConversations,
    });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await db;

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const { type, participantId, meetingId } = await req.json();

    if (type === 'direct') {
      if (!participantId) {
        return NextResponse.json({ success: false, message: "Participant ID is required for direct chat" }, { status: 400 });
      }

      const isSelf = decoded.id === participantId;
      
      // Check if conversation already exists
      // For direct chats, we want to match exactly two participants (or one for self-chat)
      let conversation = await Conversation.findOne({
        type: 'direct',
        participants: isSelf ? { $size: 1, $all: [decoded.id] } : { $size: 2, $all: [decoded.id, participantId] },
      }).populate("participants", "name email");

      if (conversation) {
        return NextResponse.json({ success: true, data: conversation });
      }

      // Create new direct conversation
      conversation = await Conversation.create({
        type: 'direct',
        participants: isSelf ? [decoded.id] : [decoded.id, participantId],
      });
      
      // Populate for the response
      await conversation.populate("participants", "name email");

      return NextResponse.json({ success: true, data: conversation });
    }

    // Group chat creation is mainly done through meeting creation, but we could add it here if needed
    return NextResponse.json({ success: false, message: "Invalid chat type for this endpoint" }, { status: 400 });

  } catch (error) {
    console.error("[POST /api/chat/conversations]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Conversation from "@/src/models/Conversation";
import Message from "@/src/models/Message";
import { User } from "@/src/models/User";
import Meeting from "@/src/models/meeting";
import { requireAuth } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await db;

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json({ success: false, message: "No active organization selected" }, { status: 400 });
    }

    const conversations = await Conversation.find({
      organizationId: user.currentOrgId,
      participants: user.id,
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
          readBy: { $ne: user.id },
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

    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    if (!user.currentOrgId) {
      return NextResponse.json({ success: false, message: "No active organization selected" }, { status: 400 });
    }

    const { type, participantId } = await req.json();

    if (type === 'direct') {
      if (!participantId) {
        return NextResponse.json({ success: false, message: "Participant ID is required for direct chat" }, { status: 400 });
      }

      const isSelf = user.id === participantId;
      
      // Check if conversation already exists in this org
      let conversation = await Conversation.findOne({
        type: 'direct',
        organizationId: user.currentOrgId,
        participants: isSelf ? { $size: 1, $all: [user.id] } : { $size: 2, $all: [user.id, participantId] },
      }).populate("participants", "name email");

      if (conversation) {
        return NextResponse.json({ success: true, data: conversation });
      }

      // Create new direct conversation
      conversation = await Conversation.create({
        type: 'direct',
        organizationId: user.currentOrgId,
        participants: isSelf ? [user.id] : [user.id, participantId],
      });
      
      await conversation.populate("participants", "name email");

      return NextResponse.json({ success: true, data: conversation });
    }

    return NextResponse.json({ success: false, message: "Invalid chat type for this endpoint" }, { status: 400 });

  } catch (error) {
    console.error("[POST /api/chat/conversations]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

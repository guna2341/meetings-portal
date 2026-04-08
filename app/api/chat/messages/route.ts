import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import Message from "@/src/models/Message";
import Conversation from "@/src/models/Conversation";
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

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ success: false, message: "Conversation ID is required" }, { status: 400 });
    }

    // Verify the user is a participant in this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: decoded.id,
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Conversation not found or access denied" }, { status: 403 });
    }

    // Fetch messages for the conversation
    const messages = await Message.find({ conversationId })
      .populate("senderId", "name email avatar")
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read by current user asynchronously
    Message.updateMany(
      { conversationId, readBy: { $ne: decoded.id } },
      { $addToSet: { readBy: decoded.id } }
    ).exec().catch(err => console.error("Failed to mark messages as read", err));

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("[GET /api/chat/messages]", error);
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

    const { conversationId, content, imageUrl, audioUrl } = await req.json();

    if (!conversationId || (!content && !imageUrl && !audioUrl)) {
      return NextResponse.json({ success: false, message: "Conversation ID and content/image/audio are required" }, { status: 400 });
    }

    // Verify the user is a participant in this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: decoded.id,
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Conversation not found or access denied" }, { status: 403 });
    }

    // Create the new message
    const message = await Message.create({
      conversationId,
      senderId: decoded.id,
      content: content || "",
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      readBy: [decoded.id],
    });

    // Update the conversation's lastMessage and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Populate sender info for the response
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("[POST /api/chat/messages]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

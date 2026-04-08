import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { User } from "@/src/models/User";
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
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Search for users by name or email
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

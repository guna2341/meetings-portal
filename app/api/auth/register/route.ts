import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { User } from "@/src/models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    await db;

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists with this email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: { id: user._id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/auth/register]", error);

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
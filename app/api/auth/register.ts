import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {

    const body = await req.json();

    if (!body.fullName || !body.email || !body.password) {
        return NextResponse.json({message: "All fields are required"}, {status: 400});
    }
    
    return NextResponse.json({
        message: "User registered successfully."
    },{status: 200});
}
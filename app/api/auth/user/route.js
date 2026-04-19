import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

export async function GET(req) {
  await connectDB();
  try {
    const decoded = await verifyToken(req);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}


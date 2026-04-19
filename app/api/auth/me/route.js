import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    return NextResponse.json({ user: decoded });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}


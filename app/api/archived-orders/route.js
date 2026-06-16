import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    requireAdmin(req);
    await connectDB();

    const students = await User.find(
      {
        role: { $in: ["student", "admin", "teacher"] },
        "archivedOrders.0": { $exists: true },
      },
      {
        email: 1,
        fullName: 1,
        grade: 1,
        archivedOrders: 1,
      },
    ).lean();

    return NextResponse.json(
      { success: true, data: students },
      { status: 200 },
    );
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.status === 403) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }
    console.error("GET /api/admin/archived-orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch archived orders." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await User.find(
      { orders: { $exists: true, $ne: [] } },
      "fullName grade orders role",
    )
      .populate("orders.approvedBy", "fullName")
      .lean();

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

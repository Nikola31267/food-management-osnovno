import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/connectDB";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    requireAdmin(req);
    await connectDB();

    const { userId, archivedOrderId } = await params;
    const body = await req.json();
    const { weeklyOrderIndex, day, orderGot } = body;

    if (!day) {
      return NextResponse.json({ message: "Day is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const archivedOrder = user.archivedOrders.id(archivedOrderId);
    if (!archivedOrder) {
      return NextResponse.json({ message: "Archived order not found" }, { status: 404 });
    }

    const weeklyOrder = archivedOrder.orders[weeklyOrderIndex ?? 0];
    if (!weeklyOrder) {
      return NextResponse.json({ message: "Weekly order not found" }, { status: 404 });
    }

    const dayObj = weeklyOrder.days?.find((d) => d.day === day);
    if (!dayObj) {
      return NextResponse.json({ message: "Day not found" }, { status: 404 });
    }

    dayObj.orderGot = Boolean(orderGot);

    // ✅ This is the fix — Mongoose can't track changes in plain Array types
    user.markModified("archivedOrders");

    await user.save();

    return NextResponse.json({
      message: "orderGot updated successfully",
      day: dayObj.day,
      orderGot: dayObj.orderGot,
    });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (error.status === 403) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    console.error("PUT archived order-got error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

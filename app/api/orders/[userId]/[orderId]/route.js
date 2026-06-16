import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import WeeklyMenu from "@/models/Menu";
import User from "@/models/User";
import mongoose from "mongoose";

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { userId, orderId } = await params;
    const menuIdStr = new URL(req.url).searchParams.get("menuId");

    const menuObjectId =
      menuIdStr && mongoose.Types.ObjectId.isValid(menuIdStr)
        ? new mongoose.Types.ObjectId(menuIdStr)
        : null;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = user.orders?.id(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const effectiveMenuId = menuObjectId || order.menuId;

    const menu = effectiveMenuId
      ? await WeeklyMenu.findById(effectiveMenuId).lean()
      : null;

    const menuDate =
      menu?.weekStart && menu?.weekEnd
        ? `${new Date(menu.weekStart).toISOString().slice(0, 10)} - ${new Date(
            menu.weekEnd,
          )
            .toISOString()
            .slice(0, 10)}`
        : menu?.weekStart
          ? new Date(menu.weekStart).toISOString().slice(0, 10)
          : String(effectiveMenuId);

    // Check if the menu deadline has passed
    const now = new Date();
    const deadline = menu?.orderDeadline ? new Date(menu.orderDeadline) : null;
    const deadlineOver = deadline ? now > deadline : true;

    if (deadlineOver) {
      // Deadline has passed — archive the order before deleting it
      user.archivedOrders.push({
        menuId: effectiveMenuId,
        weekStart: menu?.weekStart,
        weekEnd: menu?.weekEnd,
        userEmail: user.email,
        userFullName: user.fullName,
        userGrade: user.grade,
        orders: [order.toObject()],
        total: order.totalPrice || 0,
        archivedAt: new Date(),
      });
    }

    // If deadline is NOT over, just delete the order without archiving
    order.deleteOne();
    await user.save();

    return NextResponse.json({
      message: "Order deleted successfully",
      menuDate,
      deadlineOver,
    });
  } catch (err) {
    console.error("Admin delete order error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to delete order" },
      { status: 500 },
    );
  }
}
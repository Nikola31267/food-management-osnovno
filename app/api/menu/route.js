import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";

export const dynamic = "force-dynamic";

export async function POST(req) {
  await connectDB();
  try {
    const decoded = await verifyToken(req); // ← await added
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ message: "You are not admin" }, { status: 403 });
    }

    const { weekStart, weekEnd, days, orderDeadline } =
      await req.json();

    if (!orderDeadline) {
      return NextResponse.json(
        { message: "Order deadline is required" },
        { status: 400 },
      );
    }

    const deadlineDate = new Date(orderDeadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid order deadline" },
        { status: 400 },
      );
    }

    const menu = await WeeklyMenu.create({
      weekStart,
      weekEnd,
      orderDeadline: deadlineDate,
      days,
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  try {
    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 }).lean();
    return NextResponse.json(menu);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}


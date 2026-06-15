import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";
import { Parser } from "json2csv";
import mongoose from "mongoose";

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = await params;
    const download = new URL(req.url).searchParams.get("download") === "true";

    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ message: "Invalid menu id" }, { status: 400 });
    }

    const menu = await WeeklyMenu.findById(menuId).lean();

    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    const menuObjectId = new mongoose.Types.ObjectId(menuId);

    const usersWithOrders = await User.find(
      { "orders.menuId": menuObjectId },
      { email: 1, fullName: 1, grade: 1, orders: 1 },
    ).lean();

    let csv;

    if (download) {
      const rows = [];

      usersWithOrders.forEach((u) => {
        const row = {
          Name: u.fullName || "—",
          Grade: u.grade || "—",
          Понеделник: "—",
          Вторник: "—",
          Сряда: "—",
          Четвъртък: "—",
          Петък: "—",
          Total: 0,
        };

        (u.orders || [])
          .filter((o) => o.menuId?.toString() === menuId)
          .forEach((order) => {
            row.Total += order.totalPrice || 0;

            order.days?.forEach((day) => {
              row[day.day] =
                day.meals
                  ?.map((m) => `${m.mealName} x${m.quantity}`)
                  .join(", ") || "—";
            });
          });

        rows.push(row);
      });

      const parser = new Parser({
        fields: [
          "Name",
          "Grade",
          "Понеделник",
          "Вторник",
          "Сряда",
          "Четвъртък",
          "Петък",
          "Total",
        ],
      });

      csv = parser.parse(rows);
    }

    const bulkOps = usersWithOrders
      .map((u) => {
        const matchingOrders = (u.orders || []).filter(
          (o) => o.menuId?.toString() === menuId,
        );

        if (!matchingOrders.length) {
          return null;
        }

        const total = matchingOrders.reduce(
          (sum, o) => sum + (o.totalPrice || 0),
          0,
        );

        const archiveDoc = {
          menuId: menuObjectId,
          weekStart: menu.weekStart,
          weekEnd: menu.weekEnd,

          userEmail: u.email,
          userFullName: u.fullName,
          userGrade: u.grade,

          orders: matchingOrders,
          total,
          archivedAt: new Date(),
        };

        return {
          updateOne: {
            filter: { _id: u._id },
            update: {
              $push: { archivedOrders: archiveDoc },
              $pull: { orders: { menuId: menuObjectId } },
            },
          },
        };
      })
      .filter(Boolean);

    if (bulkOps.length) {
      await User.bulkWrite(bulkOps, { ordered: false });
    }

    await WeeklyMenu.findByIdAndDelete(menuId);

    if (download) {
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="orders-${menuId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      message: "Weekly menu deleted; user orders archived.",
      archivedCount: bulkOps.length,
    });
  } catch (err) {
    console.error("DELETE /api/menu error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = await params;

    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ message: "Invalid menu id" }, { status: 400 });
    }

    const body = await req.json();

    if (!body?.orderDeadline) {
      return NextResponse.json(
        { message: "orderDeadline is required" },
        { status: 400 },
      );
    }

    const days = Array.isArray(body.days) ? body.days : [];

    const normalizedDays = days.map((d) => ({
      day: String(d.day || "").trim(),
      meals: (Array.isArray(d.meals) ? d.meals : [])
        .filter((m) => String(m?.name || "").trim())
        .map((m) => ({
          name: String(m.name || "").trim(),
          weight: String(m.weight || "").trim(),
          price:
            m.price === "" || m.price == null
              ? null
              : Number(String(m.price).replace(",", ".")),
        })),
    }));

    const updateDoc = {
      weekStart: body.weekStart ? new Date(body.weekStart) : null,
      weekEnd: body.weekEnd ? new Date(body.weekEnd) : null,
      orderDeadline: new Date(body.orderDeadline),
      days: normalizedDays,
    };

    if (typeof body.menuFile === "string") {
      updateDoc.menuFile = body.menuFile;
    }

    if (typeof body.menuFileName === "string") {
      updateDoc.menuFileName = body.menuFileName;
    }

    const updated = await WeeklyMenu.findByIdAndUpdate(menuId, updateDoc, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Menu updated successfully",
      menu: updated,
    });
  } catch (err) {
    console.error("PUT /api/menu/:menuId error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
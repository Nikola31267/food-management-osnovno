import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const formatDay = (dayMeals) => {
  if (!dayMeals || dayMeals.length === 0) return "—";
  return dayMeals.map((m) => `${m.mealName} x${m.quantity}`).join(", ");
};

export async function GET(req) {
  try {
    requireAdmin(req);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderIdsParam = searchParams.get("orderIds") ?? "";
    const orderIds = orderIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const students = await User.find(
      { "archivedOrders._id": { $in: orderIds } },
      { fullName: 1, grade: 1, archivedOrders: 1 },
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Архивирани поръчки");

    sheet.columns = [
      { header: "Име", key: "fullName", width: 25 },
      { header: "Клас", key: "grade", width: 10 },
      { header: "Седмица", key: "week", width: 22 },
      { header: "Понеделник", key: "Понеделник", width: 30 },
      { header: "Вторник", key: "Вторник", width: 30 },
      { header: "Сряда", key: "Сряда", width: 30 },
      { header: "Четвъртък", key: "Четвъртък", width: 30 },
      { header: "Петък", key: "Петък", width: 30 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD5E8F0" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    students.forEach((student) => {
      student.archivedOrders.forEach((order) => {
        if (!orderIds.includes(order._id.toString())) return;

        // Build a map of day -> meals across all weeklyOrders in this archived order
        const dayMap = {};
        DAYS.forEach((d) => (dayMap[d] = []));

        order.orders?.forEach((weeklyOrder) => {
          weeklyOrder.days?.forEach((day) => {
            if (dayMap[day.day] !== undefined) {
              dayMap[day.day].push(...(day.meals ?? []));
            }
          });
        });

        const weekStart = order.weekStart
          ? new Date(order.weekStart).toLocaleDateString("bg-BG")
          : "—";
        const weekEnd = order.weekEnd
          ? new Date(order.weekEnd).toLocaleDateString("bg-BG")
          : "—";

        sheet.addRow({
          fullName: student.fullName,
          grade: student.grade,
          week: `${weekStart} → ${weekEnd}`,
          Понеделник: formatDay(dayMap["Понеделник"]),
          Вторник: formatDay(dayMap["Вторник"]),
          Сряда: formatDay(dayMap["Сряда"]),
          Четвъртък: formatDay(dayMap["Четвъртък"]),
          Петък: formatDay(dayMap["Петък"]),
          total: order.total ?? 0,
        });
      });
    });

    // Style all data rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: "middle", wrapText: true };
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="archived-orders.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    const status = err.status ?? 500;
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status },
    );
  }
}

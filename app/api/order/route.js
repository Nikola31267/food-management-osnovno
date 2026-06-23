import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";

export async function POST(req) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const userId = decoded.id;

    const { weeklyOrder } = await req.json();

    if (!weeklyOrder || typeof weeklyOrder !== "object") {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 });

    if (!menu) {
      return NextResponse.json({ error: "No active menu" }, { status: 400 });
    }

    const now = new Date();

    if (now > menu.orderDeadline) {
      return NextResponse.json(
        { error: "Ordering deadline has passed" },
        { status: 403 },
      );
    }

    const existingOrder = user.orders.find(
      (order) => order.menuId?.toString() === menu._id.toString(),
    );

    if (existingOrder) {
      return NextResponse.json(
        { error: "User has already submitted an order" },
        { status: 400 },
      );
    }

    const weeklyOrderObj = {
      menuId: menu._id,
      days: [],
      totalPrice: 0,
      paid: false,
    };

    const dayOrder = {
      Понеделник: 1,
      Вторник: 2,
      Сряда: 3,
      Четвъртък: 4,
      Петък: 5,
    };

    const orderedDays = Object.keys(weeklyOrder).sort(
      (a, b) => dayOrder[a] - dayOrder[b],
    );

    for (const day of orderedDays) {
      const mealsForDay = weeklyOrder[day];

      if (!Array.isArray(mealsForDay)) continue;

      const dayMeals = mealsForDay.map((m) => ({
        mealId: m.mealId,
        mealName: m.name || m.mealName,
        quantity: Number(m.quantity) || 1,
        price: Number(m.price) || 0,
        optional: Boolean(m.optional),
        meal_one: Boolean(m.meal_one),
      }));

      weeklyOrderObj.days.push({
        day,
        meals: dayMeals,
      });
    }

    weeklyOrderObj.totalPrice = weeklyOrderObj.days.reduce((sum, day) => {
      return (
        sum +
        day.meals.reduce((daySum, meal) => {
          return daySum + meal.price * meal.quantity;
        }, 0)
      );
    }, 0);

    user.orders.push(weeklyOrderObj);

    await user.save();

    return NextResponse.json({
      message: "Order saved successfully",
      totalPrice: weeklyOrderObj.totalPrice,
      order: weeklyOrderObj,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 },
    );
  }
}
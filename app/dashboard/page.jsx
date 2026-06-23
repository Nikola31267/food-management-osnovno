"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

import Loader from "@/components/layout/Loader";
import { ShinyButton } from "@/components/ui/shiny-button";

import { MenuHeader } from "@/components/menu/MenuHeader";
import { DaySection } from "@/components/menu/DaySection";
import { OrderBar } from "@/components/menu/OrderBar";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submiting, setSubmiting] = useState(false);

  const [menu, setMenu] = useState(null);
  const [weeklyOrder, setWeeklyOrder] = useState({});
  const [savedOrder, setSavedOrder] = useState(null);

  const [activeDay, setActiveDay] = useState(null);

  const router = useRouter();

  const menuExpired =
    menu?.orderDeadline && new Date(menu.orderDeadline) < new Date();

  const totalPrice = useMemo(() => {
    return Object.values(weeklyOrder)
      .flat()
      .reduce((sum, meal) => sum + meal.price * meal.quantity, 0);
  }, [weeklyOrder]);

  const cartCount = useMemo(() => {
    return Object.values(weeklyOrder)
      .flat()
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [weeklyOrder]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get("/api/menu");
        setMenu(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await axios.get("/api/auth/user");
        setUser(userRes.data);

        if (
          !userRes.data.grade &&
          userRes.data.role !== "teacher" &&
          userRes.data.role !== "admin"
        ) {
          router.push("/grade");
          return;
        }
      } catch {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    if (!user || !menu?._id) return;

    const userOrderForMenu = user.orders?.find(
      (o) => o.menuId?.toString() === menu._id?.toString(),
    );

    if (userOrderForMenu) {
      setHasOrdered(true);
      setSavedOrder(userOrderForMenu);
    }
  }, [user, menu]);

  const handleLogout = async () => {
    await axios.post("/api/auth/sign-out");
    router.push("/sign-in");
  };

  const getOrderedDay = (dayName) => {
    if (!savedOrder) return null;
    return savedOrder.days.find((d) => d.day === dayName);
  };

  const addMealToOrder = useCallback(
    (day, meal) => {
      if (hasOrdered || menuExpired) return;

      setWeeklyOrder((prev) => {
        const dayMeals = prev[day] || [];
        const existing = dayMeals.find((m) => m.mealId === meal._id);

        if (existing) {
          return {
            ...prev,
            [day]: dayMeals.map((m) =>
              m.mealId === meal._id
                ? { ...m, quantity: m.quantity + 1 }
                : m,
            ),
          };
        }

        if (meal.optional) {
          const alreadySelectedOptionalMeal = dayMeals.find((m) => m.optional);

          if (
            alreadySelectedOptionalMeal &&
            alreadySelectedOptionalMeal.mealId !== meal._id
          ) {
            return {
              ...prev,
              [day]: [
                ...dayMeals.filter((m) => !m.optional),
                {
                  mealId: meal._id,
                  name: meal.name,
                  price: meal.price,
                  quantity: 1,
                  optional: Boolean(meal.optional),
                  meal_one: Boolean(meal.meal_one),
                },
              ],
            };
          }
        }

        return {
          ...prev,
          [day]: [
            ...dayMeals,
            {
              mealId: meal._id,
              name: meal.name,
              price: meal.price,
              quantity: 1,
              optional: Boolean(meal.optional),
              meal_one: Boolean(meal.meal_one),
            },
          ],
        };
      });
    },
    [hasOrdered, menuExpired],
  );

  const increaseQuantity = useCallback(
    (day, mealId) => {
      if (hasOrdered || menuExpired) return;

      setWeeklyOrder((prev) => ({
        ...prev,
        [day]: (prev[day] || []).map((m) =>
          m.mealId === mealId ? { ...m, quantity: m.quantity + 1 } : m,
        ),
      }));
    },
    [hasOrdered, menuExpired],
  );

  const decreaseQuantity = useCallback(
    (day, mealId) => {
      if (hasOrdered || menuExpired) return;

      setWeeklyOrder((prev) => {
        const updated = (prev[day] || [])
          .map((m) =>
            m.mealId === mealId ? { ...m, quantity: m.quantity - 1 } : m,
          )
          .filter((m) => m.quantity > 0);

        if (updated.length === 0) {
          const copy = { ...prev };
          delete copy[day];
          return copy;
        }

        return { ...prev, [day]: updated };
      });
    },
    [hasOrdered, menuExpired],
  );

  const buildCompletedWeeklyOrder = () => {
    const completedWeeklyOrder = {};

    menu.days.forEach((dayMenu) => {
      const selectedMeals = weeklyOrder[dayMenu.day] || [];

      if (selectedMeals.length === 0) return;

      const requiredMeals = dayMenu.meals
        .filter((meal) => meal.required === true || !meal.optional)
        .map((meal) => ({
          mealId: meal._id,
          name: meal.name,
          price: meal.price,
          quantity: 1,
          optional: Boolean(meal.optional),
          meal_one: Boolean(meal.meal_one),
        }));

      const selectedOrderMeals = selectedMeals.map((meal) => ({
        mealId: meal.mealId,
        name: meal.name,
        price: meal.price,
        quantity: meal.quantity,
        optional: Boolean(meal.optional),
        meal_one: Boolean(meal.meal_one),
      }));

      const mergedMeals = [...requiredMeals, ...selectedOrderMeals];

      completedWeeklyOrder[dayMenu.day] = mergedMeals.reduce((acc, meal) => {
        const existingMeal = acc.find(
          (m) => m.mealId?.toString() === meal.mealId?.toString(),
        );

        if (existingMeal) {
          existingMeal.quantity = Math.max(
            existingMeal.quantity,
            meal.quantity,
          );

          existingMeal.optional = Boolean(
            existingMeal.optional || meal.optional,
          );

          existingMeal.meal_one = Boolean(
            existingMeal.meal_one || meal.meal_one,
          );
        } else {
          acc.push(meal);
        }

        return acc;
      }, []);
    });

    return completedWeeklyOrder;
  };

  const submitWeeklyOrder = async () => {
    if (hasOrdered || menuExpired) return;

    if (!menu?.days?.length) {
      return toast.error("Няма активно меню.");
    }

    if (!Object.keys(weeklyOrder).length) {
      return toast.info("Няма избрани ястия.");
    }

    setSubmiting(true);

    try {
      const completedWeeklyOrder = buildCompletedWeeklyOrder();

      const finalTotalPrice = Object.values(completedWeeklyOrder)
        .flat()
        .reduce((sum, meal) => sum + meal.price * meal.quantity, 0);

      const orderDays = Object.entries(completedWeeklyOrder).map(
        ([day, meals]) => ({
          day,
          meals: meals.map((meal) => ({
            mealId: meal.mealId,
            mealName: meal.name,
            quantity: meal.quantity,
            price: meal.price,
            optional: Boolean(meal.optional),
            meal_one: Boolean(meal.meal_one),
          })),
        }),
      );

      const orderPayload = {
        menuId: menu._id,
        weeklyOrder: completedWeeklyOrder,
        totalPrice: finalTotalPrice,
      };

      await axios.post("/api/order", orderPayload);

      const newSavedOrder = {
        menuId: menu._id,
        days: orderDays,
        totalPrice: finalTotalPrice,
        paid: false,
      };

      setSavedOrder(newSavedOrder);
      setHasOrdered(true);
      setWeeklyOrder({});
      toast.success("Поръчката е изпратена!");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to submit order";
      toast.error(message);
    } finally {
      setSubmiting(false);
    }
  };

  const filteredDays = useMemo(() => {
    if (!menu?.days) return [];
    return activeDay ? menu.days.filter((d) => d.day === activeDay) : menu.days;
  }, [menu, activeDay]);

  if (loading) return <Loader />;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 border-b sm:mb-10">
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Link href="/dashboard" className="shrink-0">
                  <Image
                    src="/logo-nobg.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="sm:hidden"
                    draggable={false}
                  />

                  <Image
                    src="/logo-nobg.png"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="hidden sm:block"
                    draggable={false}
                  />
                </Link>

                <h1 className="min-w-0 truncate text-base font-semibold sm:text-lg">
                  {user?.fullName} {user?.grade}
                </h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {user?.role === "admin" && (
                  <Link
                    href="/admin/menu"
                    className="text-sm transition-colors duration-200 hover:text-[#387fa5] hover:underline sm:text-base"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/dashboard/old-orders"
                  className="text-sm transition-colors duration-200 hover:text-[#387fa5] hover:underline sm:text-base"
                >
                  Стари поръчки
                </Link>

                <ShinyButton
                  className="w-full bg-[#478BAF] px-3 py-2 hover:bg-[#387fa5] sm:w-auto"
                  href="#"
                  onClick={handleLogout}
                >
                  Излез от профила
                </ShinyButton>
              </div>
            </div>
          </div>
        </div>

        <MenuHeader
          menu={menu}
          activeDay={activeDay}
          onDayChange={setActiveDay}
          cartCount={cartCount}
          hasOrdered={hasOrdered}
          menuExpired={menuExpired}
        />

        <main className="mx-auto max-w-6xl px-4 py-10 pb-28 sm:px-6 lg:px-8">
          {menu && (
            <div className="flex flex-col gap-10">
              {filteredDays.map((day) => (
                <DaySection
                  key={day.day}
                  dayMenu={day}
                  hasOrdered={hasOrdered}
                  menuExpired={menuExpired}
                  orderedDay={getOrderedDay(day.day)}
                  selectedMeals={weeklyOrder[day.day] || []}
                  onAddMeal={(meal) => addMealToOrder(day.day, meal)}
                  onIncrease={(mealId) => increaseQuantity(day.day, mealId)}
                  onDecrease={(mealId) => decreaseQuantity(day.day, mealId)}
                />
              ))}
            </div>
          )}

          <OrderBar
            count={cartCount}
            total={totalPrice}
            disabled={hasOrdered || menuExpired}
            submitting={submiting}
            onSubmit={submitWeeklyOrder}
            weeklyOrder={weeklyOrder}
          />
        </main>
      </div>
    </>
  );
}
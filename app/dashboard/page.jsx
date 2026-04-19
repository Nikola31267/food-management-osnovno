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

  // Fetch user ONCE on mount
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
  }, [router]); // ← removed menu dependency

  // Check order separately when menu loads
  useEffect(() => {
    if (!user || !menu?._id) return;

    const userOrderForMenu = user.orders?.find((o) => o.menuId === menu._id);
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
              m.mealId === meal._id ? { ...m, quantity: m.quantity + 1 } : m,
            ),
          };
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
            },
          ],
        };
      });
    },
    [hasOrdered, menuExpired],
  );

  const increaseQuantity = useCallback(
    (day, mealId) => {
      if (menuExpired) return;

      setWeeklyOrder((prev) => ({
        ...prev,
        [day]: (prev[day] || []).map((m) =>
          m.mealId === mealId ? { ...m, quantity: m.quantity + 1 } : m,
        ),
      }));
    },
    [menuExpired],
  );

  const decreaseQuantity = useCallback(
    (day, mealId) => {
      if (menuExpired) return;

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
    [menuExpired],
  );

  const submitWeeklyOrder = async () => {
    if (hasOrdered || menuExpired) return;
    if (!Object.keys(weeklyOrder).length)
      return toast.info("Няма избрани ястия.");

    setSubmiting(true);

    try {
      await axios.post("/api/order", { weeklyOrder, totalPrice });

      const newSavedOrder = {
        menuId: menu._id,
        days: Object.entries(weeklyOrder).map(([day, meals]) => ({
          day,
          meals: meals.map((m) => ({
            mealName: m.name,
            quantity: m.quantity,
            price: m.price,
          })),
        })),
        totalPrice,
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
          <div className="border-b mb-6 sm:mb-10">
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
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

                <h1 className="min-w-0 truncate text-base sm:text-lg font-semibold">
                  {user?.fullName} {user?.grade}
                </h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm sm:text-base hover:underline hover:text-[#387fa5] transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard/old-orders"
                  className="text-sm sm:text-base hover:underline hover:text-[#387fa5] transition-colors duration-200"
                >
                  Стари поръчки
                </Link>

                <ShinyButton
                  className="bg-[#478BAF] hover:bg-[#387fa5] py-2 px-3 w-full sm:w-auto"
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

          {/* {!hasOrdered && hasMenu && !menuExpired && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <p className="text-xl font-bold">
                Общо:{" "}
                <span>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalPrice)}
                </span>
              </p>

              <ShinyButton
                href="#"
                disabled={submiting}
                onClick={submitWeeklyOrder}
              >
                Поръчай
              </ShinyButton>
            </div>
          )} */}

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


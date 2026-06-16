"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Check, X, Loader2, Trash } from "lucide-react";
import Loader from "@/components/layout/Loader";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const weekKey = (weekStart, weekEnd) => `${weekStart}__${weekEnd}`;

const buildDayMeals = (orders = []) => {
  const map = {};

  DAYS.forEach((day) => {
    map[day] = {
      meals: [],
      orderGot: false,
      weeklyOrderIndex: 0,
      dayIndex: -1,
    };
  });

  orders.forEach((weeklyOrder, weeklyOrderIndex) => {
    const days = weeklyOrder?.days ?? [];

    days.forEach((dayEntry, dayIndex) => {
      const dayName = dayEntry?.day;

      if (dayName && map[dayName] !== undefined) {
        dayEntry?.meals?.forEach((meal) => {
          if (meal?.mealName) {
            map[dayName].meals.push({
              name: meal.mealName,
              quantity: meal.quantity,
              price: meal.price,
            });
          }
        });

        map[dayName].orderGot = Boolean(dayEntry?.orderGot);
        map[dayName].weeklyOrderIndex = weeklyOrderIndex;
        map[dayName].dayIndex = dayIndex;
      }
    });
  });

  return map;
};

export default function ArchivedOrdersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState("");
  const [didAutoSelectFilters, setDidAutoSelectFilters] = useState(false);

  const ordersPerPage = 5;

  const classes = useMemo(() => {
    return [...new Set(rows.map((row) => row.grade))];
  }, [rows]);

  const weeks = useMemo(() => {
    return [
      ...new Map(
        rows
          .map((row) => ({
            key: weekKey(row.weekStart, row.weekEnd),
            label: `${formatDate(row.weekStart)} → ${formatDate(row.weekEnd)}`,
          }))
          .sort((a, b) => {
            const aStart = new Date(a.key.split("__")[0]);
            const bStart = new Date(b.key.split("__")[0]);
            return bStart - aStart;
          })
          .map((week) => [week.key, week]),
      ).values(),
    ];
  }, [rows]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");

        setUser(response.data);

        if (response.data.role !== "admin") {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        setError("Error fetching user profile");
        console.error(err);
        window.location.href = "/sign-in";
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchArchivedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get("/api/archived-orders");

      const flat = [];

      data.data.forEach((student) => {
        student.archivedOrders.forEach((order) => {
          flat.push({
            orderId: order._id,
            studentId: student._id,
            fullName: student.fullName ?? "—",
            grade: student.grade ?? "—",
            weekStart: order.weekStart,
            weekEnd: order.weekEnd,
            dayMeals: buildDayMeals(order.orders ?? []),
            total: order.total ?? 0,
          });
        });
      });

      setRows(flat);
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Нямате право на достъп. Моля влезте отново."
          : err.response?.status === 403
            ? "Нямате администраторски права."
            : err.response?.data?.message ?? "Грешка при зареждане.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedWeek, selectedDay]);

  useEffect(() => {
    if (didAutoSelectFilters) return;
    if (rows.length === 0) return;

    const today = new Date();
    const todayTime = today.getTime();

    const matchingWeek = weeks.find((week) => {
      const [startStr, endStr] = week.key.split("__");
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime() + 86400000;

      return todayTime >= start && todayTime <= end;
    });

    if (matchingWeek) {
      setSelectedWeek(matchingWeek.key);
    }

    const dayIndex = today.getDay();

    if (dayIndex >= 1 && dayIndex <= 5) {
      setSelectedDay(DAYS[dayIndex - 1]);
    }

    setDidAutoSelectFilters(true);
  }, [rows, weeks, didAutoSelectFilters]);

  const handleToggleOrderGot = async (row, day) => {
    const dayData = row.dayMeals[day];

    if (!dayData || dayData.meals.length === 0) return;

    const key = `${row.orderId}-${day}`;

    setTogglingKey(key);

    try {
      await axios.put(
        `/api/archived-orders/order-got/${row.studentId}/${row.orderId}`,
        {
          weeklyOrderIndex: dayData.weeklyOrderIndex,
          day,
          orderGot: !dayData.orderGot,
        },
      );

      setRows((prevRows) =>
        prevRows.map((currentRow) => {
          if (currentRow.orderId !== row.orderId) return currentRow;

          return {
            ...currentRow,
            dayMeals: {
              ...currentRow.dayMeals,
              [day]: {
                ...currentRow.dayMeals[day],
                orderGot: !dayData.orderGot,
              },
            },
          };
        }),
      );
    } catch (err) {
      alert(err.response?.data?.message ?? "Грешка при обновяване!");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleDelete = async (orderId) => {
    const confirmed = confirm(
      "Сигурни ли сте, че искате да изтриете тази архивирана поръчка?",
    );

    if (!confirmed) return;

    setDeletingId(orderId);

    try {
      await axios.delete(`/api/archived-orders/${orderId}`);
      await fetchArchivedOrders();
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Нямате право на достъп. Моля влезте отново."
          : err.response?.status === 403
            ? "Нямате администраторски права."
            : err.response?.data?.message ?? "Грешка при изтриване.";

      alert(`Грешка: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 font-medium">Грешка</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>

          <button
            type="button"
            onClick={fetchArchivedOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  const filteredRows = rows.filter((row) => {
    const matchesName = (row.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass ? row.grade === selectedClass : true;

    const matchesWeek = selectedWeek
      ? weekKey(row.weekStart, row.weekEnd) === selectedWeek
      : true;

    const matchesDay = selectedDay
      ? row.dayMeals[selectedDay]?.meals.length > 0
      : true;

    return matchesName && matchesClass && matchesWeek && matchesDay;
  });

  const totalPages = Math.ceil(filteredRows.length / ordersPerPage);

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  const downloadOrders = async () => {
    try {
      const filteredOrderIds = filteredRows.map((row) => row.orderId).join(",");

      const url = `/api/archived-orders/download?orderIds=${encodeURIComponent(
        filteredOrderIds,
      )}`;

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to download file");
      }

      const blob = await res.blob();

      let filename = "archived-orders.xlsx";
      const contentDisposition = res.headers.get("content-disposition") || "";
      const match = contentDisposition.match(/filename="([^"]+)"/i);

      if (match?.[1]) {
        filename = match[1];
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = filename;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert(err.message || "Грешка при изтегляне на файла.");
    }
  };

  return (
    <div className="min-h-screen">
    <SidebarNav user={user} />
      <main
        style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
        className="transition-all duration-300"
      >
        <div className="p-8 min-h-screen bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Поръчки за даване</h1>

          <div className="flex flex-row items-center justify-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Търси по име..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
            />

            <div className="flex gap-2">
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
              >
                <option value="">Всички класове</option>

                {classes.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>

              <select
                value={selectedWeek}
                onChange={(event) => setSelectedWeek(event.target.value)}
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
              >
                <option value="">Всички седмици</option>

                {weeks.map((week) => (
                  <option key={week.key} value={week.key}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSelectedDay("")}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors duration-200 ${
                selectedDay === ""
                  ? "bg-[#478BAF] text-white border-[#478BAF]"
                  : "border-gray-300 hover:border-[#478BAF] hover:text-[#478BAF]"
              }`}
            >
              Всички дни
            </button>

            {DAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? "" : day)}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors duration-200 ${
                  selectedDay === day
                    ? "bg-[#478BAF] text-white border-[#478BAF]"
                    : "border-gray-300 hover:border-[#478BAF] hover:text-[#478BAF]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {filteredRows.length > 0 && (
            <div className="flex gap-2 mb-4 relative z-0">
              <button
                type="button"
                onClick={downloadOrders}
                className="p-2 rounded-full bg-[#478BAF] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Изтегли поръчките за седмицата
              </button>
            </div>
          )}

          {filteredRows.length === 0 ? (
            <p>Няма намерени архивирани поръчки.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Име</th>
                    <th className="border p-2">Клас</th>
                    <th className="border p-2">Седмица</th>
                    <th className="border p-2">Поръчка</th>
                    <th className="border p-2">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.orderId} className="border-b">
                      <td className="border p-2">{row.fullName}</td>
                      <td className="border p-2">{row.grade}</td>

                      <td className="border p-2 whitespace-nowrap text-sm">
                        {formatDate(row.weekStart)} → {formatDate(row.weekEnd)}
                      </td>

                      <td className="border p-2">
                        {(selectedDay ? [selectedDay] : DAYS).map((day) => {
                          const dayData = row.dayMeals[day];
                          const meals = dayData.meals;
                          const got = dayData.orderGot;
                          const toggleKey = `${row.orderId}-${day}`;
                          const isToggling = togglingKey === toggleKey;
                          const hasOrder = meals.length > 0;

                          if (!hasOrder) return null;

                          return (
                            <div key={day} className="mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <strong>{day}:</strong>

                                <span className="text-xs text-gray-700">
                                  Получено:
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    got
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {got ? (
                                    <>
                                      <Check className="w-4 h-4" /> Да
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-4 h-4" /> Не
                                    </>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => handleToggleOrderGot(row, day)}
                                  className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                    got
                                      ? "border-red-300 hover:bg-red-50"
                                      : "border-green-300 hover:bg-green-50"
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : got ? (
                                    "Отмени"
                                  ) : (
                                    "Отбележи"
                                  )}
                                </button>
                              </div>

                              <ul className="ml-4 mt-1">
                                {meals.map((meal, index) => (
                                  <li key={index}>
                                    {meal.name} 
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </td>


                      <td className="border p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.orderId)}
                          disabled={deletingId === row.orderId}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
                        >
                          {deletingId === row.orderId ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#478BAF] hover:bg-[#478BAF] transition-colors duration-300 hover:text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="font-semibold">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-[#478BAF] hover:bg-[#478BAF] transition-colors duration-300 hover:text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
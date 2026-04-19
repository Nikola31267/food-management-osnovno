"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import {
  formatDateForInput,
  formatDateTimeForInput,
  toISO,
  addMeal,
  removeMeal,
  handleMealChange,
  addEditMeal,
  removeEditMeal,
  handleEditMealChange,
  formatDate,
} from "@/lib/helpers";
import { uuid } from "@/lib/uuid";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [submiting, setSubmiting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const router = useRouter();

  const [form, setForm] = useState({
    weekStart: "",
    weekEnd: "",
    orderDeadline: "",
    days: DAYS.map((d) => ({ day: d, meals: [] })), // ✅ fixed: was `meals` (undefined)
  });

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await axios.get("/api/auth/user");

        if (userRes.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        await fetchMenu();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const hasAnyMeals = useMemo(
    () => form.days.some((d) => d.meals && d.meals.length > 0),
    [form.days],
  );

  const fetchMenu = async () => {
    const res = await axios.get("/api/menu");
    setWeeklyMenu(res.data?.days ? res.data : null);
  };

  const handleSubmit = async () => {
    if (!form.orderDeadline) {
      toast.error("Please set an order deadline");
      return;
    }

    if (!hasAnyMeals) {
      toast.error("Добавете поне едно ястие");
      return;
    }

    const payload = {
      weekStart: toISO(form.weekStart),
      weekEnd: toISO(form.weekEnd),
      orderDeadline: toISO(form.orderDeadline),
      days: form.days.map((d) => ({
        day: d.day,
        meals: (d.meals || [])
          .filter((m) => String(m.name || "").trim())
          .map((m) => ({
            name: String(m.name || "").trim(),
            optional: Boolean(m.optional),
          })),
      })),
    };

    setSubmiting(true);
    try {
      await axios.post("/api/menu", payload);

      toast.success("Менюто е създадено!");
      await fetchMenu();

      setForm({
        weekStart: "",
        weekEnd: "",
        orderDeadline: "",
        days: DAYS.map((d) => ({ day: d, meals: [] })),
      });
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to save menu");
    } finally {
      setSubmiting(false);
    }
  };

  const startEditing = () => {
    const copy = JSON.parse(JSON.stringify(weeklyMenu));
    copy.weekStart = formatDateForInput(copy.weekStart);
    copy.weekEnd = formatDateForInput(copy.weekEnd);
    copy.orderDeadline = formatDateTimeForInput(copy.orderDeadline);

    copy.days = copy.days.map((d) => ({
      ...d,
      meals: (d.meals || []).map((m) => ({
        ...m,
        id: m.id || uuid(),
        optional: Boolean(m.optional),
      })),
    }));

    setEditForm(copy);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  const saveEdits = async () => {
    try {
      setSubmiting(true);

      const payload = {
        ...editForm,
        weekStart: toISO(editForm.weekStart),
        weekEnd: toISO(editForm.weekEnd),
        orderDeadline: toISO(editForm.orderDeadline),
        days: editForm.days.map((d) => ({
          day: d.day,
          meals: (d.meals || [])
            .filter((m) => String(m.name || "").trim())
            .map((m) => ({
              name: String(m.name || "").trim(),
              optional: Boolean(m.optional),
            })),
        })),
      };

      await axios.put(`/api/menu/${weeklyMenu._id}`, payload);

      toast.success("Менюто е редактирано!");
      setIsEditing(false);
      await fetchMenu();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to update menu");
    } finally {
      setSubmiting(false);
    }
  };

  const deleteMenu = async () => {
    const firstConfirm = window.confirm("Изтрийте цялото седмично меню?");
    if (!firstConfirm) return;

    setSubmiting(true);

    try {
      const downloadOrders = window.confirm(
        "Искате ли да свалите всички стари поръчки преди изтриване?",
      );

      const response = await axios.delete(
        `/api/menu/${weeklyMenu._id}?download=${downloadOrders}`,
        { responseType: downloadOrders ? "blob" : "json" },
      );

      if (downloadOrders) {
        const startDate = formatDate(weeklyMenu.weekStart);
        const endDate = formatDate(weeklyMenu.weekEnd);

        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${startDate}_to_${endDate}.csv`;
        a.click();

        window.URL.revokeObjectURL(url);
      }

      setWeeklyMenu(null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to delete menu");
    } finally {
      setSubmiting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen">
      <main
        style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
        className="transition-all duration-300"
      >
        <div className="mx-auto max-w-5xl p-6 space-y-12">
          <div className="rounded-xl border bg-white p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Създай седмично меню</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-semibold">От:</p>
                <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                  <input
                    type="date"
                    className="w-full rounded-lg px-3 py-2 focus:outline-none border-none bg-transparent"
                    value={form.weekStart}
                    onChange={(e) =>
                      setForm({ ...form, weekStart: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">До:</p>
                <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                  <input
                    type="date"
                    className="w-full rounded-lg px-3 py-2 focus:outline-none border-none bg-transparent"
                    value={form.weekEnd}
                    onChange={(e) =>
                      setForm({ ...form, weekEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Последен ден за поръчка:</p>
              <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg px-3 py-2 focus:outline-none border-none bg-transparent"
                  value={form.orderDeadline}
                  onChange={(e) =>
                    setForm({ ...form, orderDeadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              {form.days.map((day, dayIndex) => (
                <div key={day.day} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{day.day}</h3>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          days: addMeal(prev.days, dayIndex),
                        }))
                      }
                      className="hover:border-[#478BAF] transition-colors duration-300 hover:bg-gray-50"
                    >
                      + Добави ястие
                    </Button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-center"
                      >
                        <input
                          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                          placeholder="Име на ястието"
                          value={meal.name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              days: handleMealChange(
                                prev.days,
                                dayIndex,
                                meal.id,
                                "name",
                                e.target.value,
                              ),
                            }))
                          }
                        />

                        <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
                          <input
                            type="checkbox"
                            checked={Boolean(meal.optional)}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                days: handleMealChange(
                                  prev.days,
                                  dayIndex,
                                  meal.id,
                                  "optional",
                                  e.target.checked,
                                ),
                              }))
                            }
                          />
                          <span>Optional</span>
                        </label>

                        <Button
                          variant="outline"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              days: removeMeal(prev.days, dayIndex, meal.id),
                            }))
                          }
                          className="justify-self-start sm:justify-self-end hover:border-[#478BAF] transition-colors duration-300 hover:bg-gray-50"
                        >
                          −
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <ShinyButton
              href="#"
              disabled={submiting}
              className="p-2"
              onClick={handleSubmit}
            >
              {submiting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span>Създай</span>
              )}
            </ShinyButton>
          </div>

          {weeklyMenu && (
            <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Сегашно меню</h2>
                <div className="flex gap-2">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      className="hover:border-[#478BAF] hover:bg-gray-50 transition-colors duration-300"
                      onClick={startEditing}
                    >
                      ✏️ Редактирай
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    disabled={submiting}
                    onClick={deleteMenu}
                  >
                    {submiting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <span>Изтрий</span>
                    )}
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                      value={editForm.weekStart}
                      onChange={(e) =>
                        setEditForm({ ...editForm, weekStart: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                      value={editForm.weekEnd}
                      onChange={(e) =>
                        setEditForm({ ...editForm, weekEnd: e.target.value })
                      }
                    />
                  </div>

                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                    value={editForm.orderDeadline}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orderDeadline: e.target.value,
                      })
                    }
                  />

                  <div className="space-y-4">
                    {editForm.days.map((day, dayIndex) => (
                      <div key={day.day} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold">{day.day}</h3>

                          <Button
                            variant="outline"
                            onClick={() =>
                              setEditForm((prev) => addEditMeal(prev, dayIndex))
                            }
                            className="hover:border-[#478BAF] hover:bg-gray-50 transition-colors duration-300"
                          >
                            + Добави ястие
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          {day.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-center"
                            >
                              <input
                                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                                value={meal.name}
                                onChange={(e) =>
                                  setEditForm((prev) =>
                                    handleEditMealChange(
                                      prev,
                                      dayIndex,
                                      meal.id,
                                      "name",
                                      e.target.value,
                                    ),
                                  )
                                }
                                placeholder="Име на ястието"
                              />

                              <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(meal.optional)}
                                  onChange={(e) =>
                                    setEditForm((prev) =>
                                      handleEditMealChange(
                                        prev,
                                        dayIndex,
                                        meal.id,
                                        "optional",
                                        e.target.checked,
                                      ),
                                    )
                                  }
                                />
                                <span>Optional</span>
                              </label>

                              <Button
                                variant="outline"
                                onClick={() =>
                                  setEditForm((prev) =>
                                    removeEditMeal(prev, dayIndex, meal.id),
                                  )
                                }
                                className="justify-self-start sm:justify-self-end hover:border-[#478BAF] transition-colors duration-300 hover:bg-gray-50"
                              >
                                −
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <ShinyButton href="#" onClick={saveEdits}>
                      {submiting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <span>Запази промените</span>
                      )}
                    </ShinyButton>
                    <Button variant="outline" onClick={cancelEditing}>
                      Откажи
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">
                  {new Date(weeklyMenu.weekStart).toLocaleDateString()} –{" "}
                  {new Date(weeklyMenu.weekEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;

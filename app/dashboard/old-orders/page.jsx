"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Loader from "@/components/layout/Loader";
import { ShinyButton } from "@/components/ui/shiny-button";
import { useRouter } from "next/navigation";

export default function MyOldOrders() {
  const [loading, setLoading] = useState(true);
  const [oldOrders, setOldOrders] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [openMap, setOpenMap] = useState({});
  const router = useRouter();

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");

      try {
        const userRes = await axios.get("/api/auth/user");

        setUser(userRes.data);

        const res = await axios.get("/api/old-orders");

        const orders = res.data?.oldOrders || [];
        setOldOrders(orders);

        const initial = {};
        for (const o of orders) initial[o._id] = false;
        setOpenMap(initial);
      } catch (e) {
        const message =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load old orders";
        setError(message);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/auth/sign-out");
    router.push("/sign-in");
  };

  const money = (n) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n ?? 0));

  const formatWeek = (o) => {
    const start = o.weekStart
      ? new Date(o.weekStart).toLocaleDateString()
      : "—";
    const end = o.weekEnd ? new Date(o.weekEnd).toLocaleDateString() : "";
    return end ? `${start} – ${end}` : start;
  };

  const toggle = (id) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="min-h-[85vh] bg-gray-100 p-8">
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
                {user?.fullName} {user?.grade ?? ""}
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
                href="/dashboard"
                className="text-sm sm:text-base hover:underline hover:text-[#387fa5] transition-colors duration-200"
              >
                Поръчай сега
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

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-center">Архивирани поръчки</h2>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 border border-red-200 bg-red-50 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* List */}
        <div className="max-w-4xl mx-auto grid gap-4">
          {!oldOrders.length ? (
            <div className="border rounded-xl bg-white p-6 text-center text-gray-600">
              Няма архивирани поръчки все още.
            </div>
          ) : (
            oldOrders.map((o) => {
              const isOpen = !!openMap[o._id];

              return (
                <div
                  key={o._id}
                  className="border rounded-xl bg-white overflow-hidden"
                >
                  {/* Clickable header (closed shows only: "Седмица" + date) */}
                  <button
                    type="button"
                    onClick={() => toggle(o._id)}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 transition border-b p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-lg truncate">
                          Седмица: {formatWeek(o)}
                        </div>

                        {/* when open we can show extra small line, when closed keep it minimal */}
                        {isOpen && (
                          <div className="text-gray-600 text-sm mt-1">
                            Общо:{" "}
                            <span className="text-gray-900 font-semibold">
                              {money(o.total)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!isOpen && (
                          <div className="text-gray-700 font-semibold">
                            {money(o.total)}
                          </div>
                        )}
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-white transition ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        >
                          ▾
                        </span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5">
                      {(o.orders || []).length ? (
                        <div className="grid gap-4">
                          {(o.orders || []).map((ord, idx) => (
                            <div key={idx} className="grid gap-3">
                              {(ord.days || []).map((d, i) => (
                                <div
                                  key={i}
                                  className="border rounded-xl p-4 bg-gray-50"
                                >
                                  <div className="font-semibold">{d.day}</div>

                                  <div className="mt-2 text-gray-700">
                                    {(d.meals || []).length ? (
                                      <div className="flex flex-col gap-2">
                                        {d.meals.map((m, mi) => (
                                          <div
                                            key={mi}
                                            className="flex items-start justify-between gap-3"
                                          >
                                            <span className="text-gray-900">
                                              {m.mealName || m.name}
                                            </span>
                                            <span className="shrink-0 rounded-lg bg-white border px-2 py-1 text-sm text-gray-700">
                                              ×{m.quantity || 1}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">—</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

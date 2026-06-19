"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Loader2, Trash, Download } from "lucide-react";
import { toast } from "react-toastify";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import axios from "axios";

const AdminOrdersPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState("");
  const [submiting, setSubmiting] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPaid, setSelectedPaid] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [menuId, setMenuId] = useState(null);

  const ordersPerPage = 5;
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setOrdersData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders");
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");

        if (response.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(response.data);
      } catch (error) {
        console.error(error);
        setError("Error fetching user profile");
        router.push("/sign-in");
      }
    };

    const fetchMenu = async () => {
      try {
        const res = await axios.get("/api/menu");
        setMenuId(res.data?._id || null);
      } catch (error) {
        console.error("Failed to fetch menu:", error);
      }
    };

    const init = async () => {
      setLoading(true);

      await Promise.all([
        fetchUserProfile(),
        fetchMenu(),
        fetchOrders(),
      ]);

      setLoading(false);
    };

    init();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedPaid, selectedRole]);

  const downloadMenuWithCountsCSV = async () => {
    const expectedPeopleInput = prompt(
      "Колко хора е трябвало да поръчат? Остави празно за автоматично броене.",
    );

    const expectedPeople = expectedPeopleInput
      ? Number(expectedPeopleInput)
      : null;

    if (
      expectedPeopleInput &&
      (Number.isNaN(expectedPeople) || expectedPeople < 0)
    ) {
      toast.error("Моля въведете валиден брой хора.");
      return;
    }

    setDownloadingInvoice(true);

    try {
      const query =
        expectedPeople !== null ? `?expectedPeople=${expectedPeople}` : "";

      const res = await axios.get(`/api/bechamel-invoice${query}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "bechamel-invoice.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      toast.success("Фактурата за Бешамел е изтеглена!");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при експортиране на фактурата за Бешамел.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const deleteOrder = async (userId, orderId) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази поръчка?")) {
      return;
    }

    setSubmiting(true);

    try {
      await axios.delete(`/api/orders/${userId}/${orderId}?menuId=${menuId}`);

      toast.success("Поръчката е изтрита успешно!");
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при изтриването на поръчката!");
    } finally {
      setSubmiting(false);
    }
  };

  const classes = [
    ...new Set(
      ordersData
        .map((u) => u.grade)
        .filter(Boolean),
    ),
  ];

  const filteredOrders = ordersData.filter((u) => {
    const matchesName = (u.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass ? u.grade === selectedClass : true;

    const matchesPaid = (() => {
      if (!selectedPaid) return true;

      const orders = Array.isArray(u.orders) ? u.orders : [];

      if (selectedPaid === "paid") {
        return orders.length > 0 && orders.every((o) => o.paid === true);
      }

      if (selectedPaid === "unpaid") {
        return orders.some((o) => o.paid === false);
      }

      return true;
    })();

    const matchesRole = selectedRole
      ? selectedRole === "teacher"
        ? u.role === "teacher" || u.role === "admin"
        : u.role === selectedRole
      : true;

    return matchesName && matchesClass && matchesPaid && matchesRole;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  if (loading) return <Loader />;

  return (
    <div>
      <SidebarNav user={user} />

      <main
        style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
        className="transition-all duration-300"
      >
        <div className="p-8 min-h-screen bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">Поръчки</h1>

            <button
              onClick={downloadMenuWithCountsCSV}
              disabled={downloadingInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-[#478BAF] text-white rounded-lg hover:bg-[#367091] transition-colors duration-300 disabled:opacity-50"
            >
              {downloadingInvoice ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Сваляне...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Свали фактура за Бешамел
                </>
              )}
            </button>
          </div>

          <div className="flex flex-row items-center justify-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Търси по име..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
            />

            <div className="flex gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
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
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
              >
                <option value="">Всички роли</option>
                <option value="student">Ученик</option>
                <option value="teacher">Учител</option>
              </select>

              <select
                value={selectedPaid}
                onChange={(e) => setSelectedPaid(e.target.value)}
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
              >
                <option value="">Всички плащания</option>
                <option value="paid">Платени</option>
                <option value="unpaid">Неплатени</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {ordersData.length === 0 ? (
            <p>Няма поръчки.</p>
          ) : filteredOrders.length === 0 ? (
            <p>Няма намерени ученици.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Име</th>
                    <th className="border p-2">Клас</th>
                    <th className="border p-2">Поръчка</th>
                    <th className="border p-2">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((u) =>
                    (u.orders || []).map((week) => (
                      <tr key={`${u._id}-${week._id}`} className="border-b">
                        <td className="border p-2">{u.fullName}</td>
                        <td className="border p-2">{u.grade}</td>

                        <td className="border p-2">
                          {(week.days || []).map((day) => (
                            <div key={day.day} className="mb-3">
                              <strong className="text-sm font-semibold capitalize">
                                {day.day}
                              </strong>

                              <ul className="ml-4 mt-1">
                                {(day.meals || []).map((meal, index) => (
                                  <li key={`${meal.mealName}-${index}`}>
                                    {meal.meal_one && (
                                      <>
                                        {typeof meal.meal_one === "string"
                                          ? meal.meal_one
                                          : meal.meal_one?.mealName ||
                                            meal.meal_one?.name ||
                                            ""}
                                        {" "}
                                      </>
                                    )}

                                    {meal.mealName}

                                    {meal.quantity
                                      ? ` x${meal.quantity}`
                                      : ""}

                                    {meal.optional ? " - optional" : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </td>

                        <td className="border p-2 text-center">
                          <button
                            onClick={() => deleteOrder(u._id, week._id)}
                            disabled={submiting}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
                          >
                            {submiting ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash />
                            )}
                          </button>
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>

              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(p - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#478BAF] hover:bg-[#478BAF] transition-colors duration-300 hover:text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="font-semibold">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(p + 1, totalPages || 1),
                    )
                  }
                  disabled={
                    currentPage === totalPages || totalPages === 0
                  }
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
};

export default AdminOrdersPage;
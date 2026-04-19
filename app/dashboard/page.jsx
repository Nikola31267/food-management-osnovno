"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

import Loader from "@/components/layout/Loader";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/sign-out");
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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
      } catch (err) {
        console.error(err);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  if (loading) return <Loader />;

  return (
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
                  href="/admin"
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
                href="#"
                className="w-full bg-[#478BAF] px-3 py-2 hover:bg-[#387fa5] sm:w-auto"
                onClick={handleLogout}
              >
                Излез от профила
              </ShinyButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

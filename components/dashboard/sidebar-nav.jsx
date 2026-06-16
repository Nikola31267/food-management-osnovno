"use client";

import { cn } from "@/lib/utils";
import axios from "axios";
import {
  BarChart3,
  ClipboardList,
  Home,
  Users,
  Utensils,
  LogOut,
  Menu as MenuIcon,
  X,
  Euro,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarNav({ user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const router = useRouter();

  const handleLogout = async () => {
    await axios.post("/api/auth/sign-out");
    router.push("/sign-in");
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "4rem" : "16rem",
    );
  }, [collapsed]);

  const navigation = [
    { name: "Начало", href: "/", icon: Home },
    { name: "Меню", href: "/admin/menu", icon: Utensils },
    { name: "Поръчки", href: "/admin/orders", icon: ClipboardList },
    {
      name: "Поръчки за даване",
      href: "/admin/orders-to-give",
      icon: Utensils,
    },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const NavLinks = ({ onNavigate, isCollapsed = false }) => (
    <nav className="mt-6 flex-1 space-y-1 px-3">
      {navigation.map((item) => {
        const isCurrent =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <div key={item.name} className="relative group/tooltip">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isCollapsed && "justify-center px-2",
                isCurrent
                  ? "bg-[#478BAF] text-white"
                  : "text-muted-foreground hover:bg-[#478BAF] hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>

            {/* Tooltip — only when collapsed */}
            {isCollapsed && (
              <div
                className={cn(
                  "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[9999]",
                  "bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md",
                  "whitespace-nowrap shadow-lg",
                  "opacity-0 -translate-x-1 scale-95",
                  "group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 group-hover/tooltip:scale-100",
                  "transition-all duration-150 ease-out",
                )}
              >
                {item.name}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const BrandRow = () => (
    <div
      className={cn(
        "flex items-center gap-2 px-4",
        collapsed && "justify-center px-2",
      )}
    >
      <Image
        src="/logo-nobg.png"
        draggable={false}
        alt="Logo"
        width={40}
        height={40}
        className="shrink-0"
      />
      {!collapsed && (
        <div className="min-w-0">
          <h1 className="min-w-0 truncate text-base sm:text-lg font-semibold">
            {user?.fullName} {user?.grade}
          </h1>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile header ── */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 border-b border-border bg-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-[#478BAF]/10"
            aria-label="Отвори меню"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo-nobg.png" alt="Logo" width={28} height={28} />
            <span className="max-w-[55vw] truncate text-sm font-semibold text-foreground">
              {user?.fullName} {user?.grade}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[#478BAF] hover:bg-[#478BAF]/10"
            aria-label="Изход"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        {/* backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        {/* drawer panel */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-border transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between pt-5 pb-4">
              <BrandRow />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mr-2 rounded-lg p-2 text-foreground hover:bg-[#478BAF]/10"
                aria-label="Затвори меню"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pb-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t px-3 py-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#478BAF] hover:bg-[#478BAF]/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Изход
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out overflow-visible",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card overflow-visible">
          <div className="flex flex-1 flex-col overflow-visible pt-5 pb-4">
            <BrandRow />
            <NavLinks isCollapsed={collapsed} />
          </div>

          <div className="border-t px-3 py-3 space-y-1">
            {/* Logout */}
            <button
              onClick={handleLogout}
              title={collapsed ? "Изход" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#478BAF] hover:bg-[#478BAF]/20 transition-colors",
                collapsed && "justify-center px-2",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Изход</span>}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() =>
                setCollapsed((c) => {
                  const next = !c;
                  localStorage.setItem("sidebar-collapsed", String(next));
                  return next;
                })
              }
              title={collapsed ? "Разшири" : "Свий"}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#478BAF]/10 transition-colors",
                collapsed && "justify-center px-2",
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                  <span>Свий</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden h-14" />
    </>
  );
}

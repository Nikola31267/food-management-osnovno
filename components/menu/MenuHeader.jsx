"use client";

import { ShoppingCart } from "lucide-react";

export function MenuHeader({ menu, cartCount, hasOrdered, menuExpired }) {
  const days = menu?.days?.map((d) => d.day) || [];

  return (
    <header className="bg-card border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:mt-2 sm:text-5xl text-balance">
              Меню
            </h1>

            {menu ? (
              <div className="mt-2 sm:mt-3 space-y-1 text-sm font-light leading-relaxed text-muted-foreground">
                <p>
                  {new Date(menu.weekStart).toLocaleDateString()} –{" "}
                  {new Date(menu.weekEnd).toLocaleDateString()}
                </p>
                <p>
                  Последна поръчка:{" "}
                  {new Date(menu.orderDeadline).toLocaleString("bg-BG", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {menuExpired && (
                  <p className="font-semibold text-red-600">
                    Поръчките за тази седмица са затворени
                  </p>
                )}
                {hasOrdered && (
                  <p className="font-semibold text-[#478BAF]">
                    Вече имаш направена поръчка за това меню
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 sm:mt-3 text-sm font-light text-muted-foreground">
                Няма активно меню за седмицата.
              </p>
            )}
          </div>

          {cartCount > 0 && !hasOrdered && !menuExpired && (
            <div className="w-full sm:w-auto">
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#478BAF]/10 px-4 py-3 sm:w-auto sm:justify-start">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-[#478BAF]">
                  {cartCount} {cartCount === 1 ? "ястие" : "ястия"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


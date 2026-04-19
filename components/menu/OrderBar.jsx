"use client";

import { useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShinyButton } from "@/components/ui/shiny-button";

const fmt = (amount) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function OrderBar({
  count,
  total,
  disabled,
  submitting,
  onSubmit,
  weeklyOrder,
}) {
  const [open, setOpen] = useState(false);
  const show = count > 0 && !disabled;

  const handleSend = () => {
    setOpen(false);
    onSubmit();
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${show
        ? "translate-y-0 opacity-100"
        : "translate-y-full opacity-0 pointer-events-none"
        }`}
    >
      <div className="border-t border-border bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#478BAF]/10">
                <ShoppingCart className="h-5 w-5 text-[#478BAF]" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {count} {count === 1 ? "ястие" : "ястия"} избрани
                </p>

              </div>
            </div>

            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={submitting}
                  className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] sm:w-auto
                ${submitting
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-[#478BAF] text-white hover:brightness-110 hover:shadow-md"
                    }`}
                >
                  {submitting ? "Изпращане..." : "Поръчай"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Преглед на поръчката</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="mt-2 space-y-4 text-sm text-foreground">
                      {Object.entries(weeklyOrder || {}).map(([day, meals]) => (
                        <div key={day}>
                          <p className="font-semibold text-base mb-1">{day}</p>
                          <ul className="space-y-1 pl-2">
                            {meals.map((meal) => (
                              <li
                                key={meal.mealId}
                                className="flex justify-between gap-4"
                              >
                                <span>
                                  {meal.name} × {meal.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Назад</AlertDialogCancel>
                  <ShinyButton href="" onClick={handleSend} disabled={submitting}>
                    {submitting ? "Изпращане..." : "Изпрати поръчката"}
                  </ShinyButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}


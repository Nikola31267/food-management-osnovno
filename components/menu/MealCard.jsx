"use client";

import { Plus, Check, X } from "lucide-react";

export function MealCard({
  meal,
  disabled,
  quantity,
  onAdd,
  onDecrease,
}) {
  const isAdded = quantity > 0;

  return (
    <div
      className={`group relative rounded-lg border px-3.5 py-3 transition-all duration-150 hover:shadow-md ${
        isAdded
          ? "border-[#478BAF]/30 bg-[#478BAF]/5"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-card-foreground">
              {meal.name}
            </h3>

            {meal.optional ? (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">
                По избор
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                Задължително
              </span>
            )}
          </div>
        </div>

        {!isAdded && meal.optional ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            aria-label={`Add ${meal.name}`}
            className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ${
              disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#478BAF]/10 text-[#478BAF] hover:bg-[#478BAF] hover:text-white transition-colors duration-300"
            }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isAdded && meal.optional && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div
            className="inline-flex w-fit items-center gap-1 rounded-full bg-[#478BAF]/10 px-2.5 py-1.5 text-xs font-semibold text-[#478BAF]"
            title="Added"
          >
            <Check className="h-4 w-4" />
            <span>Добавено</span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={onDecrease}
            aria-label={`Remove ${meal.name}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150 ${
              disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#E6E6E6] hover:bg-[#E6E6E6]/70 text-secondary-foreground transition-colors duration-300"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
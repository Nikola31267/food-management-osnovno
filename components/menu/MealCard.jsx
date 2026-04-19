"use client";

import { Plus, Check, Minus } from "lucide-react";

export function MealCard({
  meal,
  disabled,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
}) {
  const isAdded = quantity > 0;

  return (
    <div
      className={`group relative rounded-lg border px-3.5 py-3 transition-all duration-150 hover:shadow-md ${isAdded
        ? "border-[#478BAF]/30 bg-[#478BAF]/5"
        : "border-border bg-card hover:border-border/80"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-card-foreground">
            {meal.name}
          </h3>
        </div>

        {!isAdded ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            aria-label={`Add ${meal.name}`}
            className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ${disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-[#478BAF]/10 text-[#478BAF] hover:bg-[#478BAF] hover:text-white transition-colors duration-300"
              }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isAdded && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={onDecrease}
              aria-label={`Decrease ${meal.name}`}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ${disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#E6E6E6] hover:bg-[#E6E6E6]/70 text-secondary-foreground transition-colors duration-300"
                }`}
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="min-w-8 text-center text-base font-semibold">
              {quantity}
            </span>

            <button
              type="button"
              disabled={disabled}
              onClick={onIncrease}
              aria-label={`Increase ${meal.name}`}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ${disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#478BAF] hover:bg-[#5baad5] transition-colors duration-300 text-white"
                }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div
            className="inline-flex w-fit items-center gap-1 rounded-full bg-[#478BAF]/10 px-2.5 py-1.5 text-xs font-semibold text-[#478BAF]"
            title="Added"
          >
            <Check className="h-4 w-4" />
            <span>Добавено</span>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { MealCard } from "@/components/menu/MealCard";

export function DaySection({
  dayMenu,
  hasOrdered,
  menuExpired,
  orderedDay,
  selectedMeals,
  onAddMeal,
  onIncrease,
  onDecrease,
}) {
  const disabled = hasOrdered || menuExpired;

  const getQuantity = (mealId) => {
    const found = (selectedMeals || []).find((m) => m.mealId === mealId);
    return found ? found.quantity : 0;
  };

  return (
    <section>
      <div className="mb-4 sm:mb-5 flex items-center gap-3 sm:gap-4">
        <div className="flex h-9 sm:h-10 items-center rounded-lg px-3 sm:px-4 text-sm font-semibold bg-[#478BAF]/10 text-[#478BAF]">
          {dayMenu.day}
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      {hasOrdered ? (
        <div className="rounded-lg border border-border bg-card p-4">
          {orderedDay ? (
            <div className="space-y-2">
              {orderedDay.meals.map((meal, idx) => (
                <div key={idx} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 text-foreground break-words">
                    {meal.mealName} × {meal.quantity}
                  </span>{" "}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Няма поръчка за този ден
            </p>
          )}
        </div>
      ) : menuExpired ? (
        <div className="rounded-lg border border-border bg-card p-4 text-center text-muted-foreground">
          Поръчването приключи
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(dayMenu.meals || []).length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
              Няма зададена храна
            </div>
          ) : (
            dayMenu.meals.map((meal) => {
              const quantity = getQuantity(meal._id);
              return (
                <MealCard
                  key={meal._id}
                  meal={meal}
                  disabled={disabled}
                  quantity={quantity}
                  onAdd={() => onAddMeal(meal)}
                  onIncrease={() => onIncrease(meal._id)}
                  onDecrease={() => onDecrease(meal._id)}
                />
              );
            })
          )}
        </div>
      )}
    </section>
  );
}


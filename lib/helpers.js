import { uuid } from "@/lib/uuid";

export const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateTimeForInput = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const toISO = (localDateTimeOrDate) =>
  new Date(localDateTimeOrDate).toISOString();

export const addMeal = (days, dayIndex) => {
  const copy = structuredClone(days);
  copy[dayIndex].meals.push({
    id: uuid(),
    name: "",
    weight: "",
    price: "",
  });
  return copy;
};

export const removeMeal = (days, dayIndex, mealId) => {
  const copy = structuredClone(days);

  copy[dayIndex].meals = copy[dayIndex].meals.filter((m) => m.id !== mealId);

  return copy;
};

export const handleMealChange = (days, dayIndex, mealId, field, value) => {
  const copy = structuredClone(days);

  const day = copy[dayIndex];
  if (!day) return copy;

  const idx = day.meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return copy;

  day.meals[idx] = { ...day.meals[idx], [field]: value };
  return copy;
};

export const addEditMeal = (editForm, dayIndex) => {
  const copy = structuredClone(editForm);

  if (!copy.days?.[dayIndex]) return copy;

  copy.days[dayIndex].meals.push({
    id: uuid(),
    name: "",
    weight: "",
    price: "",
  });

  return copy;
};

export const removeEditMeal = (editForm, dayIndex, mealId) => {
  const copy = structuredClone(editForm);
  if (!copy.days?.[dayIndex]) return copy;

  copy.days[dayIndex].meals = copy.days[dayIndex].meals.filter(
    (m) => m.id !== mealId,
  );

  return copy;
};

export const handleEditMealChange = (
  editForm,
  dayIndex,
  mealId,
  field,
  value,
) => {
  const copy = structuredClone(editForm);

  const day = copy.days?.[dayIndex];
  if (!day) return copy;

  const idx = day.meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return copy;

  day.meals[idx] = { ...day.meals[idx], [field]: value };
  return copy;
};

export const formatDate = (date) => new Date(date).toISOString().split("T")[0];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoFromParts(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeMenuBaseName(fileName) {
  let base = fileName.replace(/\.[^.]+$/i, "").trim();

  base = base.replace(/\s*(\d{2,4})\s*[gг]\s*$/i, "$1г");

  base = base.replace(/\s+/g, " ");
  return base;
}

export function parseWeekFromMenuFilename(fileName) {
  const base = normalizeMenuBaseName(fileName);

  const m = base.match(
    /(\d{1,2})\.(\d{1,2})\s*-\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*[gг]?$/i,
  );

  if (!m) return null;

  const d1 = Number(m[1]);
  const mo1 = Number(m[2]);
  const d2 = Number(m[3]);
  const mo2 = Number(m[4]);
  let y = Number(m[5]);

  if (
    Number.isNaN(d1) ||
    Number.isNaN(mo1) ||
    Number.isNaN(d2) ||
    Number.isNaN(mo2) ||
    Number.isNaN(y)
  ) {
    return null;
  }

  if (y < 100) y = 2000 + y;

  const start = new Date(y, mo1 - 1, d1);
  const end = new Date(y, mo2 - 1, d2);

  const validStart =
    start.getFullYear() === y &&
    start.getMonth() === mo1 - 1 &&
    start.getDate() === d1;

  const validEnd =
    end.getFullYear() === y &&
    end.getMonth() === mo2 - 1 &&
    end.getDate() === d2;

  if (!validStart || !validEnd) return null;

  return {
    weekStart: isoFromParts(y, mo1, d1),
    weekEnd: isoFromParts(y, mo2, d2),
    normalizedBaseName: base.replace(/(\d{2,4})(?:\s*[gг])?$/i, "$1г"),
  };
}

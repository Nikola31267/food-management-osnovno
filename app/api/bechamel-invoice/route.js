import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

const DAYS = [
  "понеделник",
  "вторник",
  "сряда",
  "четвъртък",
  "петък",
];

const DAY_LABELS = {
  понеделник: "Понеделник",
  вторник: "Вторник",
  сряда: "Сряда",
  четвъртък: "Четвъртък",
  петък: "Петък",
};

const DAY_ALIASES = {
  monday: "понеделник",
  tuesday: "вторник",
  wednesday: "сряда",
  thursday: "четвъртък",
  friday: "петък",
  понеделник: "понеделник",
  вторник: "вторник",
  сряда: "сряда",
  четвъртък: "четвъртък",
  петък: "петък",
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectDay(value) {
  const text = normalize(value);

  for (const day of DAYS) {
    if (text.includes(day)) return day;
  }

  return DAY_ALIASES[text] || null;
}

function getGradeNumber(grade) {
  const match = String(grade || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getGradeGroup(grade) {
  const gradeNumber = getGradeNumber(grade);

  if (gradeNumber >= 1 && gradeNumber <= 4) return "grades1to4";
  if (gradeNumber >= 5 && gradeNumber <= 7) return "grades5to7";

  return "unknown";
}

function parseCSV(text) {
  const delimiter = text.includes(";") ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return { rows, delimiter };
}

function toCSV(rows, delimiter = ";") {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          const shouldQuote =
            value.includes(delimiter) ||
            value.includes('"') ||
            value.includes("\n") ||
            value.includes("\r");

          const escaped = value.replace(/"/g, '""');

          return shouldQuote ? `"${escaped}"` : escaped;
        })
        .join(delimiter),
    )
    .join("\r\n");
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);

  return d;
}

function addDays(date, days) {
  const d = new Date(date);

  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);

  return d;
}

function formatDateBG(date) {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: "Europe/Sofia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekDates(request) {
  const { searchParams } = new URL(request.url);

  const weekStartParam = searchParams.get("weekStart");

  let monday;

  if (weekStartParam) {
    const parsed = new Date(`${weekStartParam}T12:00:00`);
    monday = Number.isNaN(parsed.getTime()) ? getMonday() : getMonday(parsed);
  } else {
    monday = getMonday();
  }

  const dates = {
    понеделник: monday,
    вторник: addDays(monday, 1),
    сряда: addDays(monday, 2),
    четвъртък: addDays(monday, 3),
    петък: addDays(monday, 4),
  };

  return {
    monday,
    friday: dates.петък,
    dates,
  };
}

function shouldCountUser(user) {
  return Boolean(user);
}

function getMealDisplayName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map(getMealDisplayName)
      .filter(Boolean)
      .join(" + ");
  }

  if (typeof value === "object") {
    return String(
      value.mealName ||
        value.name ||
        value.title ||
        value.label ||
        value.value ||
        "",
    ).trim();
  }

  return String(value).trim();
}

function getMealOneName(meal) {
  return getMealDisplayName(
    meal.meal_one ||
      meal.mealOne ||
      meal.meal?.meal_one ||
      meal.meal?.mealOne ||
      meal.selectedMeal?.meal_one ||
      meal.selectedMeal?.mealOne ||
      meal.selected?.meal_one ||
      meal.selected?.mealOne,
  );
}

function getMainMealName(meal) {
  return getMealDisplayName(
    meal.mealName ||
      meal.name ||
      meal.title ||
      meal.label ||
      meal.meal?.mealName ||
      meal.selectedMeal?.mealName,
  );
}

function getMealPiecesToCount(meal) {
  const pieces = [];

  const mealOneName = getMealOneName(meal);
  const mealName = getMainMealName(meal);

  // meal.meal_one винаги се брои и винаги получава липсващите бройки.
  if (mealOneName) {
    pieces.push({
      name: mealOneName,
      shouldReceiveMissingOrders: true,
    });
  }

  // mealName се брои само ако НЕ е optional.
  // И също получава липсващите бройки.
  if (!meal.optional && mealName) {
    pieces.push({
      name: mealName,
      shouldReceiveMissingOrders: true,
    });
  }

  const uniquePieces = [];
  const seen = new Set();

  for (const piece of pieces) {
    const key = normalize(piece.name);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    uniquePieces.push(piece);
  }

  return uniquePieces;
}

function addMealToTotals({
  totals,
  dayKey,
  mealName,
  quantity,
  gradeGroup,
  shouldReceiveMissingOrders,
}) {
  const normalizedMealName = normalize(mealName);

  if (!normalizedMealName) return;

  if (!totals[dayKey].meals[normalizedMealName]) {
    totals[dayKey].meals[normalizedMealName] = {
      name: mealName,

      // Реално поръчаното количество.
      realCount: 0,

      // Финалното количество във фактурата.
      // Към него после се добавят липсващите.
      count: 0,

      grades1to4: 0,
      grades5to7: 0,

      // Тук отиват липсващите, защото не знаем от кой клас са.
      unknown: 0,

      addedMissingOrders: 0,
      shouldReceiveMissingOrders: false,
    };
  }

  totals[dayKey].meals[normalizedMealName].realCount += quantity;
  totals[dayKey].meals[normalizedMealName].count += quantity;
  totals[dayKey].meals[normalizedMealName][gradeGroup] += quantity;

  if (shouldReceiveMissingOrders) {
    totals[dayKey].meals[
      normalizedMealName
    ].shouldReceiveMissingOrders = true;
  }
}

async function getTotalsByDay(expectedPeopleFromQuery = null) {
  await connectDB();

  const users = await User.find({}).lean();
  const countableUsers = users.filter(shouldCountUser);

  const expectedPeople =
    expectedPeopleFromQuery !== null
      ? expectedPeopleFromQuery
      : countableUsers.length;

  const totals = Object.fromEntries(
    DAYS.map((day) => [
      day,
      {
        expectedPeople,
        actualOrders: 0,
        missingOrders: expectedPeople,
        meals: {},
      },
    ]),
  );

  for (const user of countableUsers) {
    const gradeGroup = getGradeGroup(user.grade);

    for (const week of user.orders || []) {
      for (const day of week.days || []) {
        const dayKey = detectDay(day.day);

        if (!dayKey) continue;

        let userHasCountedOrderForThisDay = false;

        for (const meal of day.meals || []) {
          const quantity = Number(meal.quantity || 1);
          const mealPieces = getMealPiecesToCount(meal);

          if (mealPieces.length === 0) continue;

          userHasCountedOrderForThisDay = true;

          for (const piece of mealPieces) {
            addMealToTotals({
              totals,
              dayKey,
              mealName: piece.name,
              quantity,
              gradeGroup,
              shouldReceiveMissingOrders: piece.shouldReceiveMissingOrders,
            });
          }
        }

        if (userHasCountedOrderForThisDay) {
          totals[dayKey].actualOrders += 1;
        }
      }
    }
  }

  for (const day of DAYS) {
    const missingOrders = Math.max(
      totals[day].expectedPeople - totals[day].actualOrders,
      0,
    );

    totals[day].missingOrders = missingOrders;

    for (const meal of Object.values(totals[day].meals)) {
      if (!meal.shouldReceiveMissingOrders) continue;

      meal.count += missingOrders;
      meal.unknown += missingOrders;
      meal.addedMissingOrders += missingOrders;
    }
  }

  return totals;
}

function buildMealRows(dayTotals) {
  const meals = Object.values(dayTotals?.meals || {}).sort((a, b) =>
    a.name.localeCompare(b.name, "bg"),
  );


  if (meals.length === 0) {
    return [
      ["", "", "Няма поръчки", "0", "0", "0", "0"],
    ];
  }

  const mealRows = meals.map((meal) => [
    "",
    "",
    meal.name,
    String(meal.count),
    String(meal.grades1to4),
    String(meal.grades5to7),
    String(meal.unknown),
  ]);

  return [ ...mealRows];
}

function isEmptyTemplateRow(row) {
  return row.every((cell) => String(cell || "").trim() === "");
}

function fillTitleAndDayDates(row, weekInfo) {
  const updatedRow = [...row];

  for (let i = 0; i < updatedRow.length; i++) {
    const cell = String(updatedRow[i] || "");
    const normalizedCell = normalize(cell);

    if (normalizedCell.includes("седмично меню")) {
      updatedRow[i] = `Седмично меню ${formatDateBG(
        weekInfo.monday,
      )} - ${formatDateBG(weekInfo.friday)}`;

      continue;
    }

    const detectedDay = detectDay(cell);

    if (detectedDay) {
      updatedRow[i] = `${DAY_LABELS[detectedDay]} - ${formatDateBG(
        weekInfo.dates[detectedDay],
      )}`;
    }
  }

  return updatedRow;
}

function fillTemplate(rows, totalsByDay, weekInfo) {
  let currentDay = null;
  const output = [];

  for (let i = 0; i < rows.length; i++) {
    let row = [...rows[i]];

    row = fillTitleAndDayDates(row, weekInfo);

    const rowText = row.join(" ");
    const detectedDay = detectDay(rowText);

    if (detectedDay) {
      if (currentDay) {
        output.push(...buildMealRows(totalsByDay[currentDay]));
      }

      currentDay = detectedDay;
      output.push(row);
      continue;
    }

    if (currentDay && isEmptyTemplateRow(row)) {
      continue;
    }

    output.push(row);
  }

  if (currentDay) {
    output.push(...buildMealRows(totalsByDay[currentDay]));
  }

  return output;
}

export async function GET(request) {
  try {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "menu-example.csv",
    );

    const template = await fs.readFile(templatePath, "utf8");
    const { rows, delimiter } = parseCSV(template);

    const { searchParams } = new URL(request.url);

    const expectedPeopleParam = searchParams.get("expectedPeople");

    const expectedPeople =
      expectedPeopleParam && !Number.isNaN(Number(expectedPeopleParam))
        ? Number(expectedPeopleParam)
        : null;

    const weekInfo = getWeekDates(request);
    const totalsByDay = await getTotalsByDay(expectedPeople);

    const filledRows = fillTemplate(rows, totalsByDay, weekInfo);
    const csv = "\uFEFF" + toCSV(filledRows, delimiter);

    const filename = `bechamel-invoice-${formatDateForFilename(
      weekInfo.monday,
    )}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Bechamel invoice export error:", error);

    return NextResponse.json(
      {
        error: "Грешка при генериране на фактурата за Бешамел.",
      },
      { status: 500 },
    );
  }
}
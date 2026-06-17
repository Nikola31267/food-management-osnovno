import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// CHANGE these imports to match your project paths:
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

const DAYS = [
  "понеделник",
  "вторник",
  "сряда",
  "четвъртък",
  "петък",
];

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
            value.includes("\n");

          const escaped = value.replace(/"/g, '""');
          return shouldQuote ? `"${escaped}"` : escaped;
        })
        .join(delimiter),
    )
    .join("\r\n");
}

async function getTotalsByDay() {
  await connectDB();

  const users = await User.find({}).lean();

  const totals = Object.fromEntries(DAYS.map((day) => [day, {}]));

  for (const user of users) {
    for (const week of user.orders || []) {
      for (const day of week.days || []) {
        const dayKey = detectDay(day.day);
        if (!dayKey) continue;

        for (const meal of day.meals || []) {
          const mealName = String(meal.mealName || "").trim();
          if (!mealName) continue;

          const normalizedMealName = normalize(mealName);
          const quantity = Number(meal.quantity || 1);

          if (!totals[dayKey][normalizedMealName]) {
            totals[dayKey][normalizedMealName] = {
              name: mealName,
              count: 0,
            };
          }

          totals[dayKey][normalizedMealName].count += quantity;
        }
      }
    }
  }

  return totals;
}

function fillTemplate(rows, totalsByDay) {
  let currentDay = null;
  let insertAt = null;

  const output = [];

  for (let i = 0; i < rows.length; i++) {
    const row = [...rows[i]];
    const rowText = row.join(" ");

    const detectedDay = detectDay(rowText);

    if (detectedDay) {
      if (currentDay && insertAt !== null) {
        output.push(...buildMealRows(totalsByDay[currentDay]));
      }

      currentDay = detectedDay;
      insertAt = output.length + 1;
      output.push(row);
      continue;
    }

    const nextDay = detectDay(rowText);

    if (nextDay) {
      if (currentDay && insertAt !== null) {
        output.push(...buildMealRows(totalsByDay[currentDay]));
      }

      currentDay = nextDay;
      insertAt = output.length + 1;
      output.push(row);
      continue;
    }

    // Skip empty placeholder rows inside a day section.
    if (currentDay && isEmptyTemplateRow(row)) {
      continue;
    }

    output.push(row);
  }

  if (currentDay && insertAt !== null) {
    output.push(...buildMealRows(totalsByDay[currentDay]));
  }

  return output;
}

function isEmptyTemplateRow(row) {
  return row.every((cell) => String(cell || "").trim() === "");
}

function buildMealRows(dayTotals) {
  const meals = Object.values(dayTotals || {}).sort((a, b) =>
    a.name.localeCompare(b.name, "bg"),
  );

  if (meals.length === 0) {
    return [["", "", "Няма поръчки", "0", ""]];
  }

  return meals.map((meal) => [
    "",
    "",
    meal.name,
    String(meal.count),
    "",
  ]);
}

export async function GET() {
  try {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "menu-example.csv",
    );

    const template = await fs.readFile(templatePath, "utf8");
    const { rows, delimiter } = parseCSV(template);

    const totalsByDay = await getTotalsByDay();
    const filledRows = fillTemplate(rows, totalsByDay);

    const csv = "\uFEFF" + toCSV(filledRows, delimiter);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="bechamel-invoice.csv"',
      },
    });
  } catch (error) {
    console.error("Bechamel invoice export error:", error);

    return NextResponse.json(
      { error: "Грешка при генериране на фактурата за Бешамел." },
      { status: 500 },
    );
  }
}
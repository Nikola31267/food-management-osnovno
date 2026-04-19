export const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

export function normalizeCell(v) {
  if (v == null) return "";
  return String(v).trim();
}

export function isLabelCell(s) {
  const t = String(s || "")
    .toLowerCase()
    .trim();

  // Matches ONLY labels like:
  // "сал.1", "сал 1", "супа 2", "осн.3", "десерт 1"
  // and DOES NOT match "супа от пиле..." / "салата гръцка..."
  return /^(сал|супа|осн|десерт)\.?\s*\d+\s*$/i.test(t);
}

export function isWeightCell(s) {
  const raw = s.toLowerCase().trim();
  const t = raw.replace(/\s+/g, "");
  if (/^\d+([.,]\d+)?(гр|g|кг|kg|мл|ml|л|l)$/i.test(t)) return true;
  if (/^\d+\s*фил$/i.test(raw)) return true;
  if (/^\d+\s*бр$/i.test(raw)) return true;
  return false;
}

export function toNumberMaybe(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = normalizeCell(v).replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function bestNameFromLeft(row, weightIdx) {
  for (let c = weightIdx - 1; c >= 0; c--) {
    const s = normalizeCell(row[c]);
    if (!s) continue;
    if (isLabelCell(s)) continue;
    if (!/[A-Za-zА-Яа-я]/.test(s)) continue;
    return s;
  }
  return "";
}

export function parseMealsBetween(rows, startRow, endRow) {
  const meals = [];
  let breadAdded = false;

  for (let r = startRow; r < endRow; r++) {
    const row = rows[r] || [];

    let weightIdx = -1;
    for (let c = 0; c < row.length; c++) {
      const s = normalizeCell(row[c]);
      if (s && isWeightCell(s)) {
        weightIdx = c;
        break;
      }
    }

    if (weightIdx !== -1) {
      const weight = normalizeCell(row[weightIdx]);

      let price = null;
      for (let c = weightIdx + 1; c < row.length; c++) {
        const n = toNumberMaybe(row[c]);
        if (n != null) {
          price = n;
          break;
        }
      }

      const name = bestNameFromLeft(row, weightIdx);
      if (!name) continue;
      if (!weight && price == null) continue;

      meals.push({ name, weight, price });

      if (name.toLowerCase() === "хляб") breadAdded = true;
      continue;
    }

    if (!breadAdded) {
      const breadIdx = row.findIndex(
        (v) => normalizeCell(v).toLowerCase() === "хляб",
      );
      if (breadIdx !== -1) {
        let weight = "";
        for (let c = breadIdx + 1; c < row.length; c++) {
          const s = normalizeCell(row[c]);
          if (!s) continue;
          if (isWeightCell(s) || /^\d+\s*(фил|бр)$/i.test(s.toLowerCase())) {
            weight = s;
            break;
          }
        }

        let price = null;
        for (let c = breadIdx + 1; c < row.length; c++) {
          const n = toNumberMaybe(row[c]);
          if (n != null) {
            price = n;
            break;
          }
        }

        meals.push({ name: "хляб", weight, price });
        breadAdded = true;
      }
    }
  }

  return meals;
}

export function parseMenuFromRows(rows) {
  const dayStarts = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = normalizeCell(row[c]);
      if (!cell) continue;

      const matchedDay = DAYS.find((d) => cell.includes(d));
      if (matchedDay) {
        dayStarts.push({ day: matchedDay, rowIndex: r });
        break;
      }
    }
  }

  dayStarts.sort((a, b) => a.rowIndex - b.rowIndex);

  const sections = dayStarts.map((entry, i) => {
    const start = entry.rowIndex + 1;
    const end =
      i < dayStarts.length - 1 ? dayStarts[i + 1].rowIndex : rows.length;

    return { day: entry.day, meals: parseMealsBetween(rows, start, end) };
  });

  const byDay = new Map(sections.map((s) => [s.day, s]));
  return DAYS.map((d) => byDay.get(d) || { day: d, meals: [] });
}


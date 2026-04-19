import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: String,
  weight: String,
  price: Number,
});

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
    required: true,
  },
  meals: { type: [mealSchema], default: [] },
});

const weeklyMenuSchema = new mongoose.Schema(
  {
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    orderDeadline: { type: Date, required: true },
    days: { type: [daySchema], default: [] },
    menuFile: { type: String, default: "" },
    menuFileName: { type: String, default: "" },
  },
  { timestamps: true },
);

const WeeklyMenu =
  mongoose.models.WeeklyMenu || mongoose.model("WeeklyMenu", weeklyMenuSchema);

export default WeeklyMenu;


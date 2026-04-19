import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    mealName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number },
  },
  { _id: false },
);

const dayOrderSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
      required: true,
    },
    meals: [mealSchema],
    orderGot: {
      type: Boolean,
    },
  },
  { _id: false },
);

const weeklyOrderSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WeeklyMenu",
    required: true,
  },
  days: [dayOrderSchema],
  totalPrice: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

// ✅ This replaces OldOrder model docs, but embedded in User
const archivedOrderSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyMenu",
      required: true,
    },

    weekStart: { type: Date },
    weekEnd: { type: Date },

    // snapshot of user at the time
    userEmail: { type: String },
    userFullName: { type: String },
    userGrade: { type: String },

    // snapshot of the order(s) for that menu
    orders: { type: Array, default: [] }, // keep raw order objects
    total: { type: Number, default: 0 },

    archivedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: true },
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String },
  role: { type: String, default: "student" },
  grade: { type: String },

  orders: [weeklyOrderSchema],

  // ✅ new embedded archive
  archivedOrders: { type: [archivedOrderSchema], default: [] },
});

// Helpful indexes for the embedded archive
userSchema.index({ "archivedOrders.menuId": 1 });
userSchema.index({
  "archivedOrders.weekStart": -1,
  "archivedOrders.archivedAt": -1,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;


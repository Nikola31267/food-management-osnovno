import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    mealName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    optional: {
      type: Boolean,
      default: false,
    },
    meal_one: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
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
      default: false,
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
  totalPrice: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const archivedOrderSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyMenu",
      required: true,
    },

    weekStart: {
      type: Date,
    },
    weekEnd: {
      type: Date,
    },

    userEmail: {
      type: String,
    },
    userFullName: {
      type: String,
    },
    userGrade: {
      type: String,
    },

    orders: {
      type: Array,
      default: [],
    },
    total: {
      type: Number,
      default: 0,
    },

    archivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, timestamps: true },
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
  },
  role: {
    type: String,
    default: "student",
  },
  grade: {
    type: String,
  },

  orders: [weeklyOrderSchema],

  archivedOrders: {
    type: [archivedOrderSchema],
    default: [],
  },
});

userSchema.index({ "archivedOrders.menuId": 1 });

userSchema.index({
  "archivedOrders.weekStart": -1,
  "archivedOrders.archivedAt": -1,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
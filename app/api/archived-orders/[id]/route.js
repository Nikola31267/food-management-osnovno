import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    requireAdmin(req);
    await connectDB();

    const { id } = await params;

    const result = await User.updateOne(
      { "archivedOrders._id": id },
      { $pull: { archivedOrders: { _id: id } } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Archived order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Archived order deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.status === 403) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }
    console.error("DELETE /api/admin/archived-orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete archived order." },
      { status: 500 },
    );
  }
}

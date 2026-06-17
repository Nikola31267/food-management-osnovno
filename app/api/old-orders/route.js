import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  await connectDB();

  try {
    const decoded = await verifyToken(req);
    const me = await User.findById(decoded.id).lean();

    if (!me) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    let archived = me.archivedOrders || [];

    if (fromDate || toDate) {
      archived = archived.filter((o) => {
        const ws = o.weekStart ? new Date(o.weekStart) : null;
        if (!ws) return false;
        if (fromDate && ws < fromDate) return false;
        if (toDate && ws > toDate) return false;
        return true;
      });
    }

    archived.sort((a, b) => {
      const aWs = a.weekStart ? new Date(a.weekStart).getTime() : 0;
      const bWs = b.weekStart ? new Date(b.weekStart).getTime() : 0;
      if (bWs !== aWs) return bWs - aWs;

      const aAt = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const bAt = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return bAt - aAt;
    });

    return NextResponse.json({ oldOrders: archived });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

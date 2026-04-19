import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function verifyToken(req) {
  let token;

  // Await cookies() — required in Next.js 15+
  const cookieStore = await cookies();
  token = cookieStore.get("auth-token")?.value;

  // Fallback: still support Authorization header for API clients
  if (!token && req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    throw new Error("Unauthorized");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function requireAdmin(req) {
  const decoded = await verifyToken(req);
  const role = decoded?.role || decoded?.user?.role;
  if (role !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return decoded;
}


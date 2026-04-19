import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

export async function POST(req) {
  await connectDB();
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json(
      { message: "Google token is required" },
      { status: 400 },
    );
  }

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    );
    const { email, name: fullName, email_verified } = response.data;

    if (!email_verified) {
      return NextResponse.json(
        { message: "Google email is not verified" },
        { status: 403 },
      );
    }
    if (!email.endsWith("@eduiteh.eu")) {
      return NextResponse.json(
        { message: "Only @eduiteh.eu emails are allowed" },
        { status: 403 },
      );
    }

    if (!email.startsWith("ot.")) {
      return NextResponse.json(
        { message: "Only emails starting with ot. are allowed" },
        { status: 403 },
      );
    }


    let user = await User.findOne({ email });
    const role = email.startsWith("ot.") ? "student" : "teacher";
    const grade = role === "teacher" ? "teacher" : undefined;

    if (!user) {
      user = await User.create({ email, fullName, role, grade });
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d", issuer: "turboverify-token" },
    );

    const res = NextResponse.json({
      message: "Signed in successfully",
      user,
    });

    res.cookies.set("auth-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Google sign-in error:", error);
    return NextResponse.json(
      { message: "Invalid or expired Google token" },
      { status: 401 },
    );
  }
}


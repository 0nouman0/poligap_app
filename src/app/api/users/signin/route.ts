import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Request body interface for user signin
 * @example
 * {
 *   "email": "example@domain.com",
 *   "password": "Example"
 * }
 */

// interface SignInRequest {
//   email: string;
//   password: string;
// }

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: true,
          data: { status: "ERROR", data: null, message: "Email and password are required" },
        },
        { status: 200 }
      );
    }

    const { db } = await connectToDatabase();
    const users = db.collection("users");

    const user = await users.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: true, data: { status: "ERROR", data: null, message: "Incorrect username or password." } },
        { status: 200 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: true, data: { status: "ERROR", data: null, message: "Incorrect username or password." } },
        { status: 200 }
      );
    }

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ sub: String(user._id), email: user.email }, secret, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      success: true,
      data: {
        status: "SUCCESS",
        data: {
          userToken: { AccessToken: token },
          userData: {
            userId: String(user._id),
            email: user.email,
            name: user.name || "",
          },
        },
        message: "Signed in successfully",
      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        data: {
          status: "ERROR",
          data: null,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 200 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function buildResponse({ token, user }: { token: string; user: any }) {
  return NextResponse.json({
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
      message: "Account created successfully",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

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

    // Ensure unique index on email
    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          data: { status: "ERROR", data: null, message: "Email already registered" },
        },
        { status: 200 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      email: String(email).toLowerCase(),
      passwordHash,
      name: name || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insert = await users.insertOne(newUser);
    const userDoc = { ...newUser, _id: insert.insertedId };

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ sub: String(insert.insertedId), email: userDoc.email }, secret, {
      expiresIn: "7d",
    });

    const res = buildResponse({ token, user: userDoc });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: true, data: { status: "ERROR", data: null, message: "Email already registered" } },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { success: true, data: { status: "ERROR", data: null, message: error?.message || "Unknown error" } },
      { status: 200 }
    );
  }
}

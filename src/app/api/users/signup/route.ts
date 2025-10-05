import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/users.model";
import mongoose from "mongoose";

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

    console.log('=== User Signup ===');
    console.log('Email:', email);
    console.log('Name:', name);

    if (!email || !password) {
      return NextResponse.json(
        {
          success: true,
          data: { status: "ERROR", data: null, message: "Email and password are required" },
        },
        { status: 200 }
      );
    }

    // Check if user already exists using Mongoose model
    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return NextResponse.json(
        {
          success: true,
          data: { status: "ERROR", data: null, message: "Email already registered" },
        },
        { status: 200 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = new mongoose.Types.ObjectId();

    // Create user using the User model (matches profile API expectations)
    const newUser = await User.create({
      _id: userId,
      userId: userId, // Set userId same as _id for consistency
      email: String(email).toLowerCase(),
      name: name || "User",
      uniqueId: `user_${Date.now()}`,
      status: "ACTIVE",
      country: "",
      dob: "",
      mobile: "",
      profileImage: "",
      profileCreatedOn: new Date().toISOString(),
      about: `Profile for ${name || "User"}`,
      designation: "User",
      companyName: "",
      // Store password hash in a way that signin can access it
      passwordHash, // This will be stored but not in the schema - for signin compatibility
    });

    console.log('✅ Created user in User model:', {
      _id: newUser._id?.toString(),
      userId: newUser.userId?.toString(),
      email: newUser.email,
      name: newUser.name
    });

    // Also create in the basic users collection for signin compatibility
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    await usersCollection.insertOne({
      _id: userId,
      email: String(email).toLowerCase(),
      passwordHash,
      name: name || "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Also created in users collection for signin compatibility');

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ sub: String(userId), email: newUser.email }, secret, {
      expiresIn: "7d",
    });

    const res = buildResponse({ token, user: newUser });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.error('Signup error:', error);
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

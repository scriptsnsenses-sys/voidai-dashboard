import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";

const schema = z.object({
  token: z.string(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = schema.parse(body);

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token", invalidToken: true },
        { status: 400 }
      );
    }

    const salt = crypto.randomBytes(16).toString('hex');

    const hashedPassword = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { 
          password: hashedPassword,
          salt: salt  
        },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Password reset error:", error);

    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || "Invalid input";
      return NextResponse.json(
        { message: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isUserAnAdmin(userId: string): Promise<boolean> {
  return ADMIN_USER_IDS.includes(userId);
}

const schema = z.object({
  userId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid user ID" }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId: targetUserId } = schema.parse(body);

    if (!(await isUserAnAdmin(targetUserId))) {
      return NextResponse.json(
        { message: "Unauthorized: Password reset link can only be generated if the target user is an admin." }, 
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    const targetUser = await usersCollection.findOne({ _id: new ObjectId(targetUserId) });

    if (!targetUser) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 });
    }

    const email = targetUser.email;

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    const updateResult = await usersCollection.updateOne(
      { _id: targetUser._id },
      {
        $set: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: resetTokenExpiry,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
        console.error(`Failed to update user document for password reset token: userId ${targetUserId}`);
        return NextResponse.json({ message: "Failed to set reset token in database" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error("NEXT_PUBLIC_SITE_URL is not set. Cannot generate full reset URL.");
      return NextResponse.json({ message: "Server configuration error: Site URL not set." }, { status: 500 });
    }

    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    return NextResponse.json({ success: true, resetUrl });

  } catch (error) {
    console.error("Error generating manual password reset link:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request payload", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 
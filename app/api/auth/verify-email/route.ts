import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, ensureV2UserExists } from '@/lib/postgresql-users';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { generateVerificationCode, sendEmailVerificationReminder } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Get user from V1 database (primary auth source)
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.is_verified) {
      // Ensure V2 user exists for operational data
      await ensureV2UserExists(user);

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          mongoUserId: user._id.toString(),
          username: user.username,
          email: user.email,
          plan: user.plan
        },
        process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85',
        { expiresIn: '7d' }
      );

      const cookieStore = await cookies();
      cookieStore.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
      });

      return NextResponse.json(
        { message: 'Your email is already verified', success: true, alreadyVerified: true },
        { status: 200 }
      );
    }

    if (user.verification_code !== code) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    const codeExpires = user.code_expires ? new Date(user.code_expires) : new Date();
    if (codeExpires < new Date()) {
      return NextResponse.json(
        { message: 'Verification code has expired', expired: true },
        { status: 400 }
      );
    }

    // Update verification status in V1 database
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          is_verified: true,
          verification_code: null,
          code_expires: null,
          updated_at: new Date().toISOString()
        }
      }
    );

    // Ensure V2 user exists for operational data
    await ensureV2UserExists(user);

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        mongoUserId: user._id.toString(),
        username: user.username,
        email: user.email,
        plan: user.plan
      },
      process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85',
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
    });

    return NextResponse.json(
      { message: 'Email verified successfully', success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user from V1 database (primary auth source)
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'If your email exists in our system, you will receive a verification code shortly' },
        { status: 200 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { message: 'Your email is already verified. Please log in.' },
        { status: 200 }
      );
    }

    const newCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // Update verification code in V1 database
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          verification_code: newCode,
          code_expires: codeExpires.toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    );

    await sendEmailVerificationReminder({
      email: user.email,
      code: newCode,
      username: user.username
    });

    return NextResponse.json(
      { message: 'A new verification code has been sent to your email' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
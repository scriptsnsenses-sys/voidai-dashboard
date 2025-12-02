import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, ensureV2UserExists } from '@/lib/postgresql-users';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const verifyPassword = (password: string, hashedPassword: string, salt: string): boolean => {
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === hashedPassword;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from V1 database (primary auth source)
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = verifyPassword(password, user.password, user.salt);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.is_verified === false) {
      const codeExpires = user.code_expires ? new Date(user.code_expires) : new Date();
      const isCodeExpired = codeExpires < new Date();

      return NextResponse.json(
        {
          message: 'Your email address has not been verified',
          requiresVerification: true,
          email: user.email,
          codeExpired: isCodeExpired
        },
        { status: 403 }
      );
    }

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

    (await cookies()).set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          plan: user.plan,
          plan_expires_at: user.plan_expires_at
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
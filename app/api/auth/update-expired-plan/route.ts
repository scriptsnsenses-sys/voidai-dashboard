import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        username: string;
        email: string;
        plan: string;
      };

      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ 
        _id: new ObjectId(decoded.userId)
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      if (user.plan !== 'free' && user.plan_expires_at) {
        const expirationDate = new Date(parseInt(user.plan_expires_at));
        const now = new Date();

        if (expirationDate < now) {

          const updateResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { plan: 'free', plan_expires_at: null } }
          );

          const newToken = jwt.sign(
            { 
              userId: decoded.userId,
              username: user.username,
              email: user.email,
              plan: 'free'
            },
            process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85',
            { expiresIn: '7d' }
          );

          (await cookies()).set({
            name: 'auth_token',
            value: newToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, 
            path: '/',
          });

          return NextResponse.json({
            success: true,
            message: 'Plan updated to free tier successfully',
            planExpired: true
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'No plan update needed',
        planExpired: false
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error updating expired plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
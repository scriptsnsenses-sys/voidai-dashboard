import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
      userId: string;
      mongoUserId?: string;
      username: string;
      email: string;
    };

    const userIdToUse = decoded.mongoUserId || decoded.userId;

    // Get user settings from V1 database (primary source)
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userIdToUse) });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Return user options and profile info, defaulting cache to true if not set
    const userOptions = user.user_options || { cache: true };

    // Generate proxy URL for profile picture with cache-busting timestamp
    const profilePictureUrl = user.profile_picture
      ? `/api/profile-picture/${userIdToUse}?t=${Date.now()}`
      : null;

    return NextResponse.json({
      user_options: userOptions,
      username: user.username || user.name || '',
      profile_picture: profilePictureUrl
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
      userId: string;
      mongoUserId?: string;
      username: string;
      email: string;
    };

    const userIdToUse = decoded.mongoUserId || decoded.userId;
    const { user_options, username, password, old_password, profile_picture } = await req.json();

    // Validate at least one field is provided
    if (!user_options && !username && !password && !profile_picture) {
      return NextResponse.json(
        { message: 'No update data provided' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userIdToUse) });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update user options if provided
    if (user_options && typeof user_options === 'object') {
      updateData.user_options = user_options;
    }

    // Update username if provided
    if (username) {
      if (typeof username !== 'string' || username.trim().length < 3) {
        return NextResponse.json(
          { message: 'Username must be at least 3 characters long' },
          { status: 400 }
        );
      }

      // Check if username is already taken (check both username and name fields)
      const existingUser = await db.collection('users').findOne({
        $or: [
          { username: username.trim() },
          { name: username.trim() }
        ],
        _id: { $ne: new ObjectId(userIdToUse) }
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Username is already taken' },
          { status: 409 }
        );
      }

      // Update both username and name fields for consistency
      updateData.username = username.trim();
      updateData.name = username.trim();
    }

    // Update password if provided
    if (password) {
      if (!old_password) {
        return NextResponse.json(
          { message: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      // Validate password requirements
      if (password.length < 8) {
        return NextResponse.json(
          { message: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      if (!/[A-Z]/.test(password)) {
        return NextResponse.json(
          { message: 'Password must contain at least one uppercase letter' },
          { status: 400 }
        );
      }

      if (!/[a-z]/.test(password)) {
        return NextResponse.json(
          { message: 'Password must contain at least one lowercase letter' },
          { status: 400 }
        );
      }

      if (!/[0-9]/.test(password)) {
        return NextResponse.json(
          { message: 'Password must contain at least one number' },
          { status: 400 }
        );
      }

      // Verify old password if user has a password set
      if (user.password) {
        const isValidPassword = await bcrypt.compare(old_password, user.password);
        if (!isValidPassword) {
          return NextResponse.json(
            { message: 'Current password is incorrect' },
            { status: 401 }
          );
        }
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      updateData.password = hashedPassword;
      updateData.password_salt = salt;
    }

    // Update profile picture if provided
    if (profile_picture !== undefined) {
      if (profile_picture === null || profile_picture === '') {
        updateData.profile_picture = null;
      } else if (typeof profile_picture === 'string') {
        // Validate URL format
        try {
          new URL(profile_picture);
          updateData.profile_picture = profile_picture;
        } catch {
          return NextResponse.json(
            { message: 'Invalid profile picture URL' },
            { status: 400 }
          );
        }
      }
    }

    // Update user in database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userIdToUse) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated data (excluding password)
    const responseData: any = {
      message: 'Settings updated successfully'
    };

    if (updateData.user_options) {
      responseData.user_options = updateData.user_options;
    }
    if (updateData.username) {
      responseData.username = updateData.username;
    }
    if (updateData.profile_picture !== undefined) {
      responseData.profile_picture = updateData.profile_picture;
    }
    if (updateData.password) {
      responseData.password_updated = true;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Configure R2 client (S3-compatible)
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = 'voidai';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: NextRequest) {
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Get existing profile picture to delete
    const { db } = await connectToDatabase();
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userIdToUse) });
    const oldProfilePicture = existingUser?.profile_picture;

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-pictures/${userIdToUse}-${Date.now()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload new picture to R2
    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'no-cache', // Changed to no-cache to prevent stale images
      })
    );

    // Delete old profile picture from R2 if it exists
    if (oldProfilePicture) {
      try {
        await R2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: oldProfilePicture,
          })
        );
      } catch (error) {
        console.error('Failed to delete old profile picture:', error);
        // Continue anyway - new picture is uploaded
      }
    }

    // Store filename in database
    await db.collection('users').updateOne(
      { _id: new ObjectId(userIdToUse) },
      {
        $set: {
          profile_picture: fileName,
          updated_at: new Date().toISOString()
        }
      }
    );

    // Return proxy URL with timestamp to prevent caching
    const proxyUrl = `/api/profile-picture/${userIdToUse}?t=${Date.now()}`;

    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      url: proxyUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { message: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove profile picture
export async function DELETE(req: NextRequest) {
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

    // Get existing profile picture to delete from R2
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userIdToUse) });
    
    if (user?.profile_picture) {
      try {
        // Delete from R2
        await R2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: user.profile_picture,
          })
        );
      } catch (error) {
        console.error('Failed to delete profile picture from R2:', error);
        // Continue anyway to clean up database
      }
    }

    // Remove profile picture from database
    await db.collection('users').updateOne(
      { _id: new ObjectId(userIdToUse) },
      {
        $set: {
          profile_picture: null,
          updated_at: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return NextResponse.json(
      { message: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}
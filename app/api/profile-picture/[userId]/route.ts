import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Get user from database
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user || !user.profile_picture) {
      return new NextResponse('Profile picture not found', { status: 404 });
    }

    // The profile_picture field stores just the filename (e.g., "profile-pictures/{userId}-{timestamp}.{ext}")
    const fileName = user.profile_picture;

    try {
      // Fetch from R2
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      });

      const response = await R2.send(command);

      if (!response.Body) {
        return new NextResponse('Profile picture not found in storage', { status: 404 });
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Return image with no-cache headers to prevent stale images
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': response.ContentType || 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (r2Error: any) {
      console.error('R2 fetch error:', r2Error);
      
      // If the file doesn't exist in R2, clear it from the database
      if (r2Error.Code === 'NoSuchKey') {
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { profile_picture: null } }
        );
      }
      
      return new NextResponse('Profile picture not found in storage', { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return new NextResponse('Error fetching profile picture', { status: 500 });
  }
}
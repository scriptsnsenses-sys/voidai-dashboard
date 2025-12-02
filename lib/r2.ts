import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for an R2 object
 * @param key - The object key (path) in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export async function getSignedR2Url(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a signed URL for a profile picture
 * @param profilePicturePath - The profile picture path stored in the database
 */
export async function getSignedProfilePictureUrl(profilePicturePath: string | null | undefined): Promise<string | null> {
  if (!profilePicturePath) return null;

  try {
    // Profile pictures are stored as "profile-pictures/filename.ext"
    return await getSignedR2Url(profilePicturePath, 3600); // 1 hour expiry
  } catch (error) {
    console.error('Error generating signed URL for profile picture:', error);
    return null;
  }
}

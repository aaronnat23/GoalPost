// S3-compatible storage client (works with AWS S3, Cloudflare R2, Supabase Storage)
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'seo-platform-exports';

export async function uploadFile(
  key: string,
  content: Buffer | string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return public URL or signed URL based on bucket configuration
  return `${process.env.S3_PUBLIC_URL || ''}/${key}`;
}

export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Generate presigned URL for secure downloads
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function generateExportKey(
  orgId: string,
  projectId: string,
  draftId: string,
  format: string
): string {
  const timestamp = Date.now();
  return `exports/${orgId}/${projectId}/${draftId}-${timestamp}.${format}`;
}

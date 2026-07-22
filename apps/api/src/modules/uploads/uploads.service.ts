import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * UploadsService
 * ---------------------------------------------------------------------
 * Implements the "direct-to-S3" upload pattern: the browser (via Uppy)
 * never sends large files through our API server. Instead:
 *   1. Frontend asks this service for a presigned PUT URL
 *   2. Frontend uploads the file bytes directly to S3/MinIO using that URL
 *   3. Frontend saves the resulting public `fileUrl` on the relevant
 *      entity (lesson.videoUrl, user.avatarUrl, etc.)
 * This keeps our NestJS server stateless and avoids memory/bandwidth
 * pressure from proxying multi-GB video uploads.
 * ---------------------------------------------------------------------
 */
@Injectable()
export class UploadsService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly cdnBaseUrl?: string;
  private readonly usesMinio: boolean;

  constructor(private readonly config: ConfigService) {
    this.usesMinio = this.config.get<string>('STORAGE_DRIVER') === 'minio';

    this.s3 = new AWS.S3({
      accessKeyId: this.usesMinio
        ? this.config.get<string>('MINIO_ACCESS_KEY')
        : this.config.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.usesMinio
        ? this.config.get<string>('MINIO_SECRET_KEY')
        : this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      endpoint: this.usesMinio
        ? this.config.get<string>('MINIO_ENDPOINT')
        : undefined,
      region: this.config.get<string>('AWS_REGION', 'me-south-1'),
      s3ForcePathStyle: this.usesMinio, // required for MinIO
      signatureVersion: 'v4',
    });

    this.bucket = this.usesMinio
      ? (this.config.get<string>('MINIO_BUCKET') as string)
      : (this.config.get<string>('AWS_S3_BUCKET') as string);

    this.cdnBaseUrl = this.config.get<string>('CDN_BASE_URL');
  }

  async createPresignedUploadUrl(
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const safeFileName = dto.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${dto.folder}/${userId}/${uniqueSuffix}-${safeFileName}`;

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
      Expires: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    const fileUrl = this.buildPublicUrl(key);

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3
      .deleteObject({ Bucket: this.bucket, Key: key })
      .promise();
  }

  /**
   * Server-side upload for files the backend generates itself (invoice
   * PDFs, exported reports, etc) — as opposed to the presigned-URL flow
   * above, which is for the browser uploading user-selected files directly.
   */
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
      .promise();

    return this.cdnBaseUrl ? `${this.cdnBaseUrl}/${key}` : this.s3.endpoint.href + `${this.bucket}/${key}`;
  }

  /**
   * Signed Streaming URLs: turns a lesson's stored (public-looking) video
   * URL into a short-lived, tamper-proof S3 GET URL. This is what makes
   * "Prevent Direct Download / hotlinking" meaningful — the link expires
   * and can't be shared/reused beyond the watch session.
   */
  getSignedPlaybackUrl(fileUrl: string, expirySeconds = 4 * 60 * 60): string {
    const key = this.extractKeyFromUrl(fileUrl);
    if (!key) return fileUrl; // external URL (e.g. YouTube) — nothing to sign

    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expirySeconds,
    });
  }

  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      if (this.cdnBaseUrl && fileUrl.startsWith(this.cdnBaseUrl)) {
        return fileUrl.replace(`${this.cdnBaseUrl}/`, '');
      }
      const url = new URL(fileUrl);
      // Path-style (MinIO): /<bucket>/<key>  |  Virtual-hosted (AWS): /<key>
      const parts = url.pathname.replace(/^\//, '').split('/');
      if (this.usesMinio && parts[0] === this.bucket) {
        return parts.slice(1).join('/');
      }
      if (url.hostname.startsWith(`${this.bucket}.`)) {
        return parts.join('/');
      }
      return null;
    } catch {
      return null;
    }
  }

  private buildPublicUrl(key: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${key}`;
    }
    if (this.usesMinio) {
      return `${this.config.get<string>('MINIO_ENDPOINT')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.config.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
  }
}

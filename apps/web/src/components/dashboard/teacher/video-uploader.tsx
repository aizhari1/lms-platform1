'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { requestUploadUrl } from '@/lib/api/teacher';
import { cn } from '@/lib/utils';

/**
 * VideoUploader
 * ---------------------------------------------------------------------
 * Implements the direct-to-S3 upload pattern described in the Uploads
 * module: request a presigned PUT URL, then PUT the raw file bytes
 * straight to S3/MinIO from the browser — the NestJS API never sees
 * the file body, keeping large video uploads off our server entirely.
 * ---------------------------------------------------------------------
 */
export function VideoUploader({
  folder,
  onUploaded,
}: {
  folder: 'course-videos' | 'lesson-pdfs' | 'course-thumbnails';
  onUploaded: (fileUrl: string) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setProgress(0);

    try {
      const { uploadUrl, fileUrl } = await requestUploadUrl({
        fileName: file.name,
        contentType: file.type,
        folder,
      });

      await uploadWithProgress(uploadUrl, file, setProgress);

      setStatus('done');
      onUploaded(fileUrl);
    } catch {
      setStatus('error');
    }
  }

  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-border p-8 text-center transition hover:border-siraj-500',
        status === 'done' && 'border-success',
      )}
    >
      <input type="file" className="hidden" onChange={handleFileChange} accept="video/*,application/pdf,image/*" />

      {status === 'uploading' ? (
        <>
          <Loader2 size={28} className="animate-spin text-siraj-400" />
          <p className="text-sm text-muted">جارٍ الرفع... {progress}%</p>
        </>
      ) : status === 'done' ? (
        <>
          <CheckCircle2 size={28} className="text-success" />
          <p className="text-sm text-success">تم الرفع بنجاح</p>
        </>
      ) : (
        <>
          <UploadCloud size={28} className="text-muted" />
          <p className="text-sm text-muted">اضغط لاختيار ملف الفيديو / PDF</p>
        </>
      )}
    </label>
  );
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => (xhr.status < 300 ? resolve() : reject());
    xhr.onerror = () => reject();
    xhr.send(file);
  });
}

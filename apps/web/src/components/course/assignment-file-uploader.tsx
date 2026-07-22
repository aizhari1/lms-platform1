'use client';

import { useState } from 'react';
import { UploadCloud, X, FileText, Loader2 } from 'lucide-react';
import { requestAssignmentUploadUrl } from '@/lib/api/assignments';
import { toast } from '@/lib/toast';

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSizeKb: number;
}

export function AssignmentFileUploader({
  maxFiles,
  files,
  onFilesChange,
}: {
  maxFiles: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    if (files.length + selected.length > maxFiles) {
      toast.error(`أقصى عدد ملفات مسموح بيه: ${maxFiles}`);
      return;
    }

    setIsUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of selected) {
        const { uploadUrl, fileUrl } = await requestAssignmentUploadUrl({
          fileName: file.name,
          contentType: file.type,
        });
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        uploaded.push({ fileUrl, fileName: file.name, fileSizeKb: Math.round(file.size / 1024) });
      }
      onFilesChange([...files, ...uploaded]);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  function removeFile(idx: number) {
    onFilesChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {files.length < maxFiles && (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-border p-6 text-center text-sm text-muted transition hover:border-siraj-500">
          <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={isUploading} />
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> جاري الرفع...
            </>
          ) : (
            <>
              <UploadCloud size={16} /> ارفع ملف واحد أو أكتر (حد أقصى {maxFiles})
            </>
          )}
        </label>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg bg-ink-soft px-3 py-2 text-sm">
              <FileText size={14} className="text-siraj-400" />
              <span className="flex-1 truncate text-white">{file.fileName}</span>
              <button onClick={() => removeFile(idx)} className="text-muted hover:text-danger">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

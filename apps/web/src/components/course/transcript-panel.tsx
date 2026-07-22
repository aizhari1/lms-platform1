'use client';

import { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

export function TranscriptPanel({ transcript }: { transcript: string }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!transcript) return null;

  return (
    <div className="card-surface mt-4 overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <FileText size={16} className="text-siraj-400" /> النص الكامل للدرس (Transcript)
        </span>
        <ChevronDown size={16} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="max-h-96 overflow-y-auto border-t border-ink-border px-4 py-4">
          <p className="whitespace-pre-line text-sm leading-7 text-muted-light">{transcript}</p>
        </div>
      )}
    </div>
  );
}

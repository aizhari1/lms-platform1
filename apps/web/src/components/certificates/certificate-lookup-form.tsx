'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CertificateLookupForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [certificateNo, setCertificateNo] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!certificateNo.trim()) return;
    router.push(`/${locale}/verify-certificate/${certificateNo.trim()}`);
  }

  return (
    <div className="card-surface p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-siraj-900/40 text-siraj-400">
        <ShieldCheck size={32} />
      </div>
      <h1 className="mb-1 text-xl font-bold text-white">تحقّق من صحة شهادة</h1>
      <p className="mb-6 text-sm text-muted">
        اكتب رقم الشهادة الموجود أسفل الوثيقة للتأكد من صحتها
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={certificateNo}
          onChange={(e) => setCertificateNo(e.target.value)}
          placeholder="مثال: CERT-2026-000123"
          className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
        />
        <Button type="submit" size="sm">
          تحقّق
        </Button>
      </form>
    </div>
  );
}

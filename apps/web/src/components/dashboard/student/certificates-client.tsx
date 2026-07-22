'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Award, Download, ShieldCheck } from 'lucide-react';
import { fetchMyCertificates } from '@/lib/api/student';

interface Certificate {
  id: string;
  certificateNo: string;
  pdfUrl: string | null;
  issuedAt: string;
  course: { titleAr: string; thumbnailUrl: string | null };
}

export function CertificatesClient() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyCertificates()
      .then(setCertificates)
      .catch(() => setCertificates([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <Award size={40} className="text-siraj-500" />
          <p className="text-muted">
            لسه معندك أي شهادات — أكمل أول كورس بنسبة 100% لتحصل على شهادتك
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert) => (
        <div key={cert.id} className="card-surface overflow-hidden">
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-ink-soft to-ink p-6">
            {cert.course.thumbnailUrl ? (
              <Image
                src={cert.course.thumbnailUrl}
                alt={cert.course.titleAr}
                fill
                className="object-cover opacity-30"
              />
            ) : null}
            <Award size={48} className="relative z-10 text-siraj-400" />
          </div>

          <div className="p-4">
            <h3 className="mb-1 line-clamp-1 text-sm font-bold text-white">
              {cert.course.titleAr}
            </h3>
            <p className="mb-3 flex items-center gap-1 text-xs text-muted">
              <ShieldCheck size={13} /> رقم الشهادة: {cert.certificateNo.slice(0, 10)}...
            </p>

            <a
              href={cert.pdfUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full !py-2 text-xs"
            >
              <Download size={14} /> تحميل الشهادة
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

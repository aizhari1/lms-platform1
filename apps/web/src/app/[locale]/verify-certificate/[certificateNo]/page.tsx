import { CheckCircle2, XCircle, Award, User, BookOpen, Calendar } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { verifyCertificate } from '@/lib/api/certificates';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; certificateNo: string }>;
}) {
  const { locale, certificateNo } = await params;

  const result = await verifyCertificate(certificateNo).catch(() => null);

  return (
    <>
      <Navbar locale={locale} />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-lg">
          {result?.isValid ? (
            <div className="card-surface p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="mb-1 text-xl font-bold text-white">شهادة موثّقة ✅</h1>
              <p className="mb-6 text-sm text-muted">
                رقم الشهادة: <span className="font-mono text-siraj-400">{result.certificateNo}</span>
              </p>

              <div className="space-y-4 border-t border-ink-border pt-6 text-right">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-siraj-400" />
                  <div>
                    <p className="text-xs text-muted">اسم الطالب</p>
                    <p className="text-sm font-semibold text-white">{result.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-siraj-400" />
                  <div>
                    <p className="text-xs text-muted">الكورس</p>
                    <p className="text-sm font-semibold text-white">{result.courseTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award size={16} className="text-siraj-400" />
                  <div>
                    <p className="text-xs text-muted">المدرّس</p>
                    <p className="text-sm font-semibold text-white">{result.teacherName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-siraj-400" />
                  <div>
                    <p className="text-xs text-muted">تاريخ الإصدار</p>
                    <p className="text-sm font-semibold text-white">{formatDate(result.issuedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-surface p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
                <XCircle size={32} />
              </div>
              <h1 className="mb-1 text-xl font-bold text-white">شهادة غير موجودة</h1>
              <p className="text-sm text-muted">
                رقم الشهادة ده مش موجود في سجلاتنا — تأكد إنك ماسح كود QR صحيح أو راجع الرقم المدخل
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

import { ExamResultClient } from '@/components/exam/exam-result-client';

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;

  return <ExamResultClient attemptId={attemptId} locale={locale} />;
}

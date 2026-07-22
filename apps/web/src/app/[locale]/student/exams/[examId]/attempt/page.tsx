import { ExamAttemptClient } from '@/components/exam/exam-attempt-client';

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string }>;
}) {
  const { locale, examId } = await params;

  return <ExamAttemptClient examId={examId} locale={locale} />;
}

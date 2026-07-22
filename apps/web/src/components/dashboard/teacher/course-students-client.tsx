'use client';

import { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { fetchCourseStudents } from '@/lib/api/teacher';
import { bulkNotifyCourse, bulkEmailCourse } from '@/lib/api/teacher-analytics';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';

function BulkActionsBar({ courseId }: { courseId: string }) {
  const [mode, setMode] = useState<'none' | 'notify' | 'email'>('none');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  async function handleSend() {
    setIsSending(true);
    try {
      const result =
        mode === 'notify'
          ? await bulkNotifyCourse(courseId, title, body)
          : await bulkEmailCourse(courseId, title, body);
      setSentMessage(`تمت جدولة الإرسال لـ ${result.queuedFor} طالب — هيوصلهم خلال دقايق ✓`);
      setMode('none');
      setTitle('');
      setBody('');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="card-surface mb-4 p-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setMode(mode === 'notify' ? 'none' : 'notify')}>
          <Bell size={13} className="ml-1.5" /> إشعار جماعي
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMode(mode === 'email' ? 'none' : 'email')}>
          <Mail size={13} className="ml-1.5" /> إيميل جماعي
        </Button>
        {sentMessage && <span className="text-xs font-semibold text-success">{sentMessage}</span>}
      </div>

      {mode !== 'none' && (
        <div className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === 'notify' ? 'عنوان الإشعار' : 'موضوع الإيميل'}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="نص الرسالة..."
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <Button size="sm" onClick={handleSend} isLoading={isSending} disabled={!title || !body}>
            إرسال لكل الطلاب المشتركين
          </Button>
        </div>
      )}
    </div>
  );
}

export function CourseStudentsClient({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseStudents(courseId)
      .then(setStudents)
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <BulkActionsBar courseId={courseId} />
      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-soft text-right text-xs text-muted">
            <tr>
              <th className="px-5 py-3">الطالب</th>
              <th className="px-5 py-3">تاريخ التسجيل</th>
              <th className="px-5 py-3">التقدم</th>
              <th className="px-5 py-3">المصدر</th>
            </tr>
          </thead>
          <tbody>
            {students.map((enrollment) => (
              <tr key={enrollment.id} className="border-t border-ink-border/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-siraj-900/40 text-xs font-bold text-siraj-400">
                      {enrollment.student.fullName.charAt(0)}
                    </span>
                    <div>
                      <p className="font-medium text-white">{enrollment.student.fullName}</p>
                      <p className="text-xs text-muted">{enrollment.student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-light">
                  {new Date(enrollment.enrolledAt).toLocaleDateString('ar')}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={Number(enrollment.progressPct)} className="w-24" />
                    <span className="text-xs text-muted">
                      {Number(enrollment.progressPct).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted-light">{enrollment.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

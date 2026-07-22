'use client';

import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  RotateCcw,
  FileText,
  Download,
  History,
} from 'lucide-react';
import {
  fetchCourseAssignments,
  fetchSubmissionHistory,
  submitAssignment,
  type Assignment,
  type AssignmentSubmission,
} from '@/lib/api/assignments';
import { AssignmentFileUploader, type UploadedFile } from './assignment-file-uploader';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG: Record<
  AssignmentSubmission['status'],
  { label: string; icon: typeof Clock; className: string }
> = {
  SUBMITTED: { label: 'قيد المراجعة', icon: Clock, className: 'bg-siraj-900/40 text-siraj-400' },
  REVISION_REQUESTED: { label: 'مطلوب تعديل', icon: RotateCcw, className: 'bg-amber-500/10 text-amber-400' },
  GRADED: { label: 'تم التصحيح', icon: CheckCircle2, className: 'bg-green-500/10 text-green-400' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function AssignmentCard({ assignment, onUpdated }: { assignment: Assignment; onUpdated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<AssignmentSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submission = assignment.mySubmission;
  const isPastDue = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
  const canSubmit =
    !submission || submission.status === 'REVISION_REQUESTED';
  const isBlocked = isPastDue && !assignment.allowLateSubmission && !submission;

  async function handleSubmit() {
    if (files.length === 0) return;
    setIsSubmitting(true);
    try {
      await submitAssignment(assignment.id, { files, notesAr: notes || undefined });
      setShowForm(false);
      setFiles([]);
      setNotes('');
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleHistory() {
    if (!showHistory) {
      const data = await fetchSubmissionHistory(assignment.id);
      setHistory(data);
    }
    setShowHistory((v) => !v);
  }

  return (
    <div className="card-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
            <ClipboardList size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">{assignment.titleAr}</h3>
            <p className="mt-1 text-xs text-muted-light">{assignment.descriptionAr}</p>
            {assignment.dueDate && (
              <p className={`mt-1 text-xs ${isPastDue ? 'text-danger' : 'text-muted'}`}>
                آخر ميعاد للتسليم: {formatDate(assignment.dueDate)}
              </p>
            )}
          </div>
        </div>
        {submission && (
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CONFIG[submission.status].className}`}
          >
            {STATUS_CONFIG[submission.status].label}
          </span>
        )}
      </div>

      {submission?.status === 'GRADED' && (
        <div className="mb-3 rounded-lg bg-ink-soft p-4">
          <p className="text-sm font-bold text-siraj-400">
            الدرجة: {submission.grade} / {assignment.maxPoints}
          </p>
          {submission.feedbackAr && (
            <p className="mt-1 text-sm text-muted-light">💬 {submission.feedbackAr}</p>
          )}
        </div>
      )}

      {submission?.status === 'REVISION_REQUESTED' && submission.revisionNote && (
        <div className="mb-3 rounded-lg bg-amber-500/10 p-4">
          <p className="text-sm text-amber-400">🔄 {submission.revisionNote}</p>
        </div>
      )}

      {isBlocked ? (
        <p className="text-sm text-danger">انتهى الموعد النهائي لتسليم الواجب ده</p>
      ) : canSubmit && !showForm ? (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          {submission ? 'إعادة التسليم' : 'تسليم الواجب'}
        </Button>
      ) : showForm ? (
        <div className="space-y-3">
          <AssignmentFileUploader
            maxFiles={assignment.maxFiles}
            files={files}
            onFilesChange={setFiles}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات إضافية للمدرّس (اختياري)"
            rows={2}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={files.length === 0}>
              تسليم
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      ) : null}

      {submission && (
        <button
          onClick={toggleHistory}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-siraj-400"
        >
          <History size={13} /> سجل التسليمات ({submission.attemptNumber})
        </button>
      )}

      {showHistory && (
        <div className="mt-3 space-y-2 border-t border-ink-border pt-3">
          {history.map((h) => (
            <div key={h.id} className="rounded-lg bg-ink-soft p-3 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-white">محاولة #{h.attemptNumber}</span>
                <span className="text-muted">{formatDate(h.submittedAt)}</span>
              </div>
              {h.files.map((f) => (
                <a
                  key={f.id}
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-siraj-400 hover:underline"
                >
                  <FileText size={12} /> {f.fileName} <Download size={11} />
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseAssignmentsPanel({ courseId }: { courseId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    fetchCourseAssignments(courseId)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card-surface h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-light">مفيش واجبات في الكورس ده لسه</p>;
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <AssignmentCard key={a.id} assignment={a} onUpdated={load} />
      ))}
    </div>
  );
}

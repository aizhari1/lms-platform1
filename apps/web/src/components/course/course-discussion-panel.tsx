'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchCourseComments, postComment } from '@/lib/api/learn';
import { Button } from '@/components/ui/button';

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { fullName: string; avatarUrl: string | null; role: string };
  replies: CommentItem[];
}

export function CourseDiscussionPanel({ courseId }: { courseId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ content: string }>();

  useEffect(() => {
    fetchCourseComments(courseId).then(setComments);
  }, [courseId]);

  async function onSubmit(values: { content: string }) {
    const comment = await postComment({ content: values.content, courseId });
    setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
    reset();
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex gap-3">
        <input
          {...register('content', { required: true })}
          placeholder="اسأل سؤال عام عن الكورس أو شارك زمايلك..."
          className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
        />
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          إرسال
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-light">لسه مفيش نقاشات على الكورس ده</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="card-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-siraj-900/40 text-xs font-bold text-siraj-400">
                  {comment.user.fullName.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{comment.user.fullName}</p>
                  {comment.user.role === 'TEACHER' && (
                    <span className="text-[10px] text-siraj-400">المدرّس</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-light">{comment.content}</p>

              {comment.replies?.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-ink-border pt-3 ltr:pl-6 rtl:pr-6">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-sm text-muted-light">
                      <span className="font-semibold text-white">{reply.user.fullName}: </span>
                      {reply.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

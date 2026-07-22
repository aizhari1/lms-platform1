import { apiClient } from './client';

export interface RubricCriterion {
  id: string;
  titleAr: string;
  maxPoints: string;
  order: number;
}

export interface SubmissionFile {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSizeKb: number | null;
}

export interface AssignmentSubmission {
  id: string;
  attemptNumber: number;
  status: 'SUBMITTED' | 'REVISION_REQUESTED' | 'GRADED';
  isLate: boolean;
  notesAr: string | null;
  grade: string | null;
  feedbackAr: string | null;
  revisionNote: string | null;
  submittedAt: string;
  gradedAt: string | null;
  files: SubmissionFile[];
}

export interface Assignment {
  id: string;
  titleAr: string;
  descriptionAr: string;
  dueDate: string | null;
  allowLateSubmission: boolean;
  latePenaltyPctPerDay: string;
  maxFiles: number;
  maxPoints: string;
  rubric: { id: string; titleAr: string; criteria: RubricCriterion[] } | null;
  mySubmission: AssignmentSubmission | null;
}

export async function fetchCourseAssignments(courseId: string): Promise<Assignment[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/assignments`);
  return data.data;
}

export async function fetchSubmissionHistory(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data } = await apiClient.get(`/assignments/${assignmentId}/my-submissions`);
  return data.data;
}

export async function submitAssignment(
  assignmentId: string,
  payload: { files: { fileUrl: string; fileName: string; fileSizeKb?: number }[]; notesAr?: string },
) {
  const { data } = await apiClient.post(`/assignments/${assignmentId}/submit`, payload);
  return data.data;
}

export async function requestAssignmentUploadUrl(payload: {
  fileName: string;
  contentType: string;
}) {
  const { data } = await apiClient.post('/uploads/presigned-url', {
    ...payload,
    folder: 'assignment-submissions',
  });
  return data.data as { uploadUrl: string; fileUrl: string; key: string };
}

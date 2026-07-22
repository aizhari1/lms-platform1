import { apiClient } from './client';

export interface ExamQuestion {
  id: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'TRUE_FALSE' | 'ESSAY' | 'FILL_BLANK' | 'MATCHING' | 'ORDERING';
  textAr: string;
  points: string;
  choices: { id: string; textAr: string }[];
  matchOptions?: string[];
}

export interface StartAttemptResponse {
  attemptId: string;
  durationMin: number;
  startedAt: string;
  questions: ExamQuestion[];
}

export async function startExamAttempt(examId: string): Promise<StartAttemptResponse> {
  const { data } = await apiClient.post(`/exams/${examId}/attempts/start`);
  return data.data;
}

export async function submitExamAttempt(
  attemptId: string,
  answers: {
    questionId: string;
    selectedChoiceIds?: string[];
    essayText?: string;
    matchingAnswers?: { choiceId: string; submittedMatch: string }[];
  }[],
) {
  const { data } = await apiClient.patch(`/attempts/${attemptId}/submit`, { answers });
  return data.data;
}

export interface TimelineEvent {
  attemptId: string;
  examTitle: string;
  courseTitle: string | null;
  stage: 'STARTED' | 'SUBMITTED' | 'GRADED';
  date: string;
  isPassed: boolean | null;
  scoreObtained: string | null;
  scoreTotal: string | null;
}

export async function fetchMyAttemptsTimeline(): Promise<TimelineEvent[]> {
  const { data } = await apiClient.get('/my-attempts/timeline');
  return data.data;
}

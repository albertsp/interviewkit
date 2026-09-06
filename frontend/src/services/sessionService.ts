import { apiFetch, handleResponse } from "./httpClient";
import type { Question, Card, Result  } from "@/reducers/sessionReducer";


interface CreateSessionResponse{
  session_id: number;
  stack: string;
  level: string;
  topic: string;
  questions: Pick<Question, "question_id" | "question" | "type">[];

}
interface SubmitAnswerResponse{
  session_id: number;
  question_id: number;
  result: Result ;
  feedback: string;
  card: Card;
}
interface CompleteSessionResponse{
  session_id: number;
  xp_earned: number;
  bonus_applied: boolean;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  progress_in_level: number;
  xp_per_level: number;
  breakdown: {question_id: number; result: Result; xp: number}[];
}
export interface ResultsSummary{
  correct: number;
  partially_correct: number;
  incorrect: number;
}
export interface StackStat{
  stack: string;
  sessions: number;
  cards: number;
}
export interface RecentSession{
  stack: string;
  level: string;
  created_at: string | null;
  total_questions: number;
  correct: number;
  partially_correct: number;
  incorrect: number;
}
export interface CardsSummary{
  total: number;
  top_tags: string[];
}
export interface StatsResponse{
  results_summary: ResultsSummary;
  stacks_stats: StackStat[];
  recent_sessions: RecentSession[];
  cards_summary: CardsSummary;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  progress_in_level: number;
  xp_per_level: number;
  sessions_count: number;
}
interface SaveCardResponse{
  card_id: number;
  concept: string;
}
export async function createSession({ stack, level, topic } : {stack: string, level: string, topic: string }): Promise<CreateSessionResponse> {
  const response = await apiFetch("/sessions/", {
    method: "POST",
    body: JSON.stringify({ stack, level, topic }),
  });
  return handleResponse<CreateSessionResponse>(response);
}

export async function submitAnswer(sessionId: number, questionId: number, answer: string): Promise<SubmitAnswerResponse> {
  const response = await apiFetch(
    `/sessions/${sessionId}/questions/${questionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ answer }),
    }
  );
  return handleResponse<SubmitAnswerResponse>(response);
}

export async function completeSession(sessionId: number): Promise<CompleteSessionResponse> {
  const response = await apiFetch(`/sessions/${sessionId}/complete`, {
    method: "POST",
  });
  return handleResponse<CompleteSessionResponse>(response);
}

export async function getMyStats(): Promise<StatsResponse> {
  const response = await apiFetch("/me/stats", {
    method: "GET",
  });
  return handleResponse<StatsResponse>(response);
}

export async function saveCard({
  question_id,
  session_id,
  concept,
  definition,
  explanation,
  use_case,
  avoid_when,
  mnemonic,
  tags,
  code,
  code_language,
}: Card & { question_id: number; session_id: number}): Promise<SaveCardResponse> {
  const response = await apiFetch("/cards/", {
    method: "POST",
    body: JSON.stringify({
      question_id,
      session_id,
      concept,
      definition,
      explanation,
      use_case,
      avoid_when,
      mnemonic,
      tags,
      code,
      code_language,
    }),
  });
  return handleResponse<SaveCardResponse>(response);
}
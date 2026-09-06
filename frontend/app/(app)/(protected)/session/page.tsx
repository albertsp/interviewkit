"use client";

import { useState, useReducer, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { sessionReducer, initialState, type Card } from "@/reducers/sessionReducer";
import {
  createSession,
  submitAnswer,
  saveCard,
  completeSession,
} from "@/services/sessionService";

import { PageContainer } from "@/components/layout/PageContainer";
import SessionSetup from "@/components/session/SessionSetup";
import ProgressIndicator from "@/components/session/ProgressIndicator";
import QuestionPhase from "@/components/session/QuestionPhase";
import FeedbackLoading from "@/components/session/FeedbackLoading";
import FeedbackPhase from "@/components/session/FeedbackPhase";
import SessionComplete from "@/components/session/SessionComplete";

export default function SessionPage() {
  const { user, refreshStats } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against calling /complete more than once per session
  const completeCalledRef = useRef(false);

  const handleCreateSession = async (select: { rol: string; stack: string; topic: string; level: string }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await createSession(select);
      dispatch({ type: "INIT_SESSION", payload: data });
      completeCalledRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    dispatch({ type: "ANSWER_SUBMITTED" });

    const question = state.questions[state.currentQuestionIndex];

    try {
      const data = await submitAnswer(
        state.session_id as number,
        question.question_id,
        state.currentAnswer
      );
      dispatch({ type: "FEEDBACK_RECEIVED", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleCardChange = (updatedCard: Card) => {
    dispatch({ type: "UPDATE_CARD", payload: updatedCard });
  };

  const handleSaveCard = async () => {
    const question = state.questions[state.currentQuestionIndex];
    const card = state.card as Card;

    try {
      await saveCard({
        question_id: question.question_id,
        session_id: state.session_id as number,
        concept: card.concept,
        definition: card.definition,
        explanation: card.explanation,
        use_case: card.use_case,
        avoid_when: card.avoid_when,
        mnemonic: card.mnemonic,
        tags: card.tags,
        code: card.code,
        code_language: card.code_language,
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Error al guardar la card: " + (err instanceof Error ? err.message : String(err)) });
      return;
    }

    dispatch({ type: "CARD_SAVED" });
  };

  // When the session reaches the "complete" phase, calculate XP and refresh stats
  useEffect(() => {
    if (state.currentPhase !== "complete") return;
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const data = await completeSession(state.session_id as number);
        if (cancelled) return;
        dispatch({ type: "SESSION_COMPLETED", payload: data });
        refreshStats();
      } catch {
        if (cancelled) return;
        // On failure, still show the complete screen with 0 XP
        dispatch({
          type: "SESSION_COMPLETED",
          payload: {
            xp_earned: 0,
            total_xp: 0,
            level: 1,
            xp_to_next_level: 500,
            bonus_applied: false,
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.currentPhase, state.session_id, user, refreshStats]);

  if (!state.session_id) {
    return (
      <SessionSetup
        loading={loading}
        error={error}
        onSubmit={handleCreateSession}
      />
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <PageContainer max="3xl">
        <ProgressIndicator
          currentIndex={state.currentQuestionIndex}
          total={state.questions.length}
          stack={state.stack as string}
          level={state.level as string}
          topic={state.topic ?? undefined}
          questionType={currentQuestion?.type}
        />

        <AnimatePresence mode="wait">
          {state.currentPhase === "answering" && (
            <QuestionPhase
              question={currentQuestion.question}
              questionType={currentQuestion.type}
              stack={state.stack as string}
              answer={state.currentAnswer}
              error={state.error}
              onAnswerChange={(value) =>
                dispatch({ type: "ANSWER_CHANGED", payload: value })
              }
              onSubmit={handleSubmitAnswer}
            />
          )}

          {state.currentPhase === "loading_feedback" && <FeedbackLoading />}

          {state.currentPhase === "waiting_action" && (
            <FeedbackPhase
              feedback={state.feedback}
              result={state.result}
              card={state.card}
              originalCard={state.originalCard}
              onCardChange={handleCardChange}
              onDiscard={() => dispatch({ type: "CARD_DISCARDED" })}
              onSave={handleSaveCard}
            />
          )}

          {state.currentPhase === "complete" && (
            <SessionComplete
              totalQuestions={state.questions.length}
              stack={state.stack as string}
              onDashboard={() => router.push("/dashboard")}
              onNewSession={() => {
                completeCalledRef.current = false;
                dispatch({ type: "RESET_SESSION" });
              }}
              xpEarned={state.sessionXpEarned}
              totalXp={state.sessionTotalXp}
              level={state.sessionLevel}
              xpToNextLevel={state.sessionXpToNextLevel}
              xpPerLevel={state.sessionXpPerLevel}
              progressInLevel={state.sessionProgressInLevel}
              bonusApplied={state.sessionBonusApplied}
              loading={!state.sessionCompleteLoaded}
            />
          )}
        </AnimatePresence>
    </PageContainer>
  );
}

"use client";

import { useState, useReducer, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { sessionReducer, initialState } from "@/reducers/sessionReducer";
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
  // Obtenemos el token JWT y el refrescador de stats del contexto
  const { user, refreshStats } = useAuth();
  const router = useRouter();
  // Reducer que controla todo el flujo de la sesion
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  // Estado para controlar el loading de la creacion de sesion
  const [loading, setLoading] = useState(false);
  // Estado para mostrar errores en modo seleccion
  const [error, setError] = useState(null);
  // Flag para evitar llamar a /complete mas de una vez por sesion
  const completeCalledRef = useRef(false);

  // --- HANDLERS QUE ORQUESTAN EL FLUJO ---

  // Crea la sesion en el backend (modo seleccion) y la inicializa en el reducer
  const handleCreateSession = async (select) => {
    setLoading(true);
    setError(null);

    try {
      const data = await createSession(select);
      dispatch({ type: "INIT_SESSION", payload: data });
      completeCalledRef.current = false;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Envia la respuesta del usuario al backend y guarda el feedback de la IA
  const handleSubmitAnswer = async () => {
    dispatch({ type: "ANSWER_SUBMITTED" });

    const question = state.questions[state.currentQuestionIndex];

    try {
      const data = await submitAnswer(
        state.session_id,
        question.question_id,
        state.currentAnswer
      );
      dispatch({ type: "FEEDBACK_RECEIVED", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  };

  // Actualiza los campos de la card en el estado del reducer
  const handleCardChange = (updatedCard) => {
    dispatch({ type: "UPDATE_CARD", payload: updatedCard });
  };

  // Guarda la card de estudio en el backend y avanza a la siguiente pregunta
  const handleSaveCard = async () => {
    const question = state.questions[state.currentQuestionIndex];

    try {
      await saveCard({
        question_id: question.question_id,
        session_id: state.session_id,
        concept: state.card.concept,
        definition: state.card.definition,
        explanation: state.card.explanation,
        use_case: state.card.use_case,
        avoid_when: state.card.avoid_when,
        mnemonic: state.card.mnemonic,
        tags: state.card.tags,
        code: state.card.code,
        code_language: state.card.code_language,
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Error al guardar la card: " + err.message });
      return;
    }

    dispatch({ type: "CARD_SAVED" });
  };

  // Cuando la sesion entra en fase "complete", calcula XP y refresca stats
  useEffect(() => {
    if (state.currentPhase !== "complete") return;
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const data = await completeSession(state.session_id);
        if (cancelled) return;
        dispatch({ type: "SESSION_COMPLETED", payload: data });
        // Refrescamos las stats del navbar con los nuevos valores
        refreshStats();
      } catch (err) {
        if (cancelled) return;
        // Si falla, igual mostramos la pantalla de complete con XP 0
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

  // --- RENDERIZADO ---

  // Modo seleccion: no hay sesion activa, mostramos el setup
  if (!state.session_id) {
    return (
      <SessionSetup
        loading={loading}
        error={error}
        onSubmit={handleCreateSession}
      />
    );
  }

  // Modo sesion activa: renderizado condicional segun la fase
  return (
    <PageContainer max="3xl">
        <ProgressIndicator
          currentIndex={state.currentQuestionIndex}
          total={state.questions.length}
          stack={state.stack}
          level={state.level}
          topic={state.topic}
          questionType={state.questions[state.currentQuestionIndex]?.type}
        />

        <AnimatePresence mode="wait">
          {/* Fase: respondiendo la pregunta */}
          {state.currentPhase === "answering" && (
            <QuestionPhase
              question={state.questions[state.currentQuestionIndex].question}
              questionType={state.questions[state.currentQuestionIndex].type}
              stack={state.stack}
              answer={state.currentAnswer}
              error={state.error}
              onAnswerChange={(value) =>
                dispatch({ type: "ANSWER_CHANGED", payload: value })
              }
              onSubmit={handleSubmitAnswer}
            />
          )}

          {/* Fase: esperando el feedback de la IA */}
          {state.currentPhase === "loading_feedback" && <FeedbackLoading />}

          {/* Fase: feedback recibido, card editable con codigo */}
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

          {/* Fase: sesion completada */}
          {state.currentPhase === "complete" && (
            <SessionComplete
              totalQuestions={state.questions.length}
              stack={state.stack}
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

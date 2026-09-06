

type Phase = "answering" | "loading_feedback" | "waiting_action" | "complete";
export type Result = "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT";
type Action = 
| { type: "INIT_SESSION"; payload: { session_id: number; stack: string; level: string; topic: string; questions: Pick<Question, "question_id" | "question" | "type">[] } }
| { type: "ANSWER_CHANGED"; payload: string }
| { type: "ANSWER_SUBMITTED";}
| { type: "FEEDBACK_RECEIVED"; payload: { feedback: string; result: Result; card: Card}}
| { type: "UPDATE_CARD"; payload: Partial<Card>}
| { type: "NEXT_QUESTION";}
| { type: "CARD_SAVED" ;}
| { type: "CARD_DISCARDED" ;}
| { type: "SESSION_ENDED";}
| { type: "SESSION_COMPLETED"; payload: {xp_earned?: number; total_xp?: number; level?: number; xp_to_next_level?: number; progress_in_level?: number; bonus_applied?: boolean; xp_per_level?: number}}
| { type: "SET_ERROR"; payload: string | null}
| { type: "RESET_SESSION";}   




export interface Question {
  question_id: number;
  question: string;
  type: "theory" | "code";
  answer: string;
  feedback: null | string;
  result?: Result;
}
export interface Card {
  concept: string;
  definition: string;
  explanation: string;
  use_case: string;
  avoid_when: string;
  mnemonic: string;
  code: string;
  code_language: string;
  tags: string[];
}

interface State {
  session_id: number | null;
  stack: string | null;
  level: string | null;
  topic: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  currentAnswer: string;
  currentPhase: Phase;
  result: null | Result;
  feedback: null | string;
  card: null | Card;
  originalCard: null | Card;
  sessionXpEarned: number;
  sessionTotalXp: number;
  sessionLevel: number;
  sessionXpToNextLevel: number;
  sessionProgressInLevel: number;
  sessionXpPerLevel: number;
  sessionBonusApplied: boolean;       
  sessionCompleteLoaded: boolean;
  error: null | string; 
}

export const initialState: State = {
  session_id: null,
  stack: null,
  level: null,
  topic: null,
  questions: [],
  currentQuestionIndex: 0,
  currentAnswer: "",
  currentPhase: "answering",
  result: null,
  feedback: null,
  card: null,
  originalCard: null,
  sessionXpEarned: 0,
  sessionTotalXp: 0,  
  sessionLevel: 1,
  sessionXpToNextLevel: 0,
  sessionProgressInLevel: 0,
  sessionXpPerLevel: 0,
  sessionBonusApplied: false,
  sessionCompleteLoaded: false, 
  error: null,
};

// Reducer que controla todo el flujo de la sesion de entrevista
export function sessionReducer(state: State, action: Action): State {
  switch (action.type) {
    // Inicializa la sesion con los datos devueltos por POST /sessions/
    case "INIT_SESSION": {
      const { session_id, stack, level, topic, questions } = action.payload;
      // Añadimos campos answer y feedback a cada pregunta para seguimiento
      const initializedQuestions = questions.map((q) => ({
        ...q,
        answer: "",
        feedback: null,
      }));
      return {
        ...state,
        session_id,
        stack,
        level,
        topic,
        questions: initializedQuestions,
        currentQuestionIndex: 0,
        currentAnswer: "",
        currentPhase: "answering",
        result: null,
        feedback: null,
        card: null,
        originalCard: null,
        sessionXpEarned: 0,
        sessionTotalXp: 0,
        sessionLevel: 1,
        sessionXpToNextLevel: 0,
        sessionProgressInLevel: 0,
        sessionXpPerLevel: 0,
        sessionBonusApplied: false,
        sessionCompleteLoaded: false,
        error: null,
      };
    }

    // El usuario escribe en el textarea de respuesta
    case "ANSWER_CHANGED":
      return { ...state, currentAnswer: action.payload, error: null };
      
    // El usuario pulsa el boton de enviar respuesta
    case "ANSWER_SUBMITTED": {
      // Guardamos la respuesta del usuario en el array de preguntas
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.currentQuestionIndex] = {
        ...updatedQuestions[state.currentQuestionIndex],
        answer: state.currentAnswer,
      };
      return {
        ...state,
        questions: updatedQuestions,
        currentPhase: "loading_feedback",
        error: null,
      };
    }

    // La IA ha devuelto el feedback y la card
    case "FEEDBACK_RECEIVED": {
      // Guardamos el feedback en el array de preguntas
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.currentQuestionIndex] = {
        ...updatedQuestions[state.currentQuestionIndex],
        feedback: action.payload.feedback,
        result: action.payload.result,
      };
      return {
        ...state,
        questions: updatedQuestions,
        result: action.payload.result,
        feedback: action.payload.feedback,
        card: action.payload.card,
        // originalCard se congela aqui como snapshot inmutable para detectar ediciones
        originalCard: action.payload.card,
        currentPhase: "waiting_action",
      };
    }

    // El usuario edita los campos de la card en el editor inline
    case "UPDATE_CARD":
      if (!state.card) return state;
      return {
        ...state,
        card: { ...state.card, ...action.payload },
      };

    // Avanza a la siguiente pregunta o termina la sesion si no hay mas
    case "NEXT_QUESTION": {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, currentPhase: "complete", card: null, feedback: null };
      }
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        currentAnswer: "",
        feedback: null,
        card: null,
        currentPhase: "answering",
        error: null,
      };
    }

    // El usuario guarda la card en el backend
    case "CARD_SAVED": {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, card: null, currentPhase: "complete" };
      }
      return {
        ...state,
        card: null,
        currentQuestionIndex: nextIndex,
        currentAnswer: "",
        feedback: null,
        currentPhase: "answering",
        error: null,
      };
    }

    // El usuario descarta la card sin guardarla
    case "CARD_DISCARDED": {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, card: null, currentPhase: "complete" };
      }
      return {
        ...state,
        card: null,
        currentQuestionIndex: nextIndex,
        currentAnswer: "",
        feedback: null,
        currentPhase: "answering",
        error: null,
      };
    }

    // Finaliza la sesion manualmente
    case "SESSION_ENDED":
      return { ...state, currentPhase: "complete", card: null, feedback: null };

    // Guarda el resultado de POST /sessions/<id>/complete
    case "SESSION_COMPLETED": {
      const { xp_earned, total_xp, level, xp_to_next_level, progress_in_level, xp_per_level, bonus_applied } = action.payload;
      return {
        ...state,
        currentPhase: "complete",
        card: null,
        feedback: null,
        sessionXpEarned: xp_earned ?? 0,
        sessionTotalXp: total_xp ?? 0,
        sessionLevel: level ?? 1,
        sessionXpToNextLevel: xp_to_next_level ?? 0,
        sessionProgressInLevel: progress_in_level ?? 0,
        sessionXpPerLevel: xp_per_level ?? 0,
        sessionBonusApplied: !!bonus_applied,
        sessionCompleteLoaded: true,
      };
    }

    // Guarda un mensaje de error para mostrar al usuario
    case "SET_ERROR":
      return { ...state, error: action.payload, currentPhase: "answering" };

    // Reinicia el estado para empezar una nueva sesion
    case "RESET_SESSION":
      return { ...initialState };

    default:
      return state;
  }
}

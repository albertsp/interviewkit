import { sessionReducer, initialState, type Card } from '@/reducers/sessionReducer';

type Action = Parameters<typeof sessionReducer>[1];

const QUESTIONS = [
  { question_id: 1, question: 'T1', type: 'theory' as const },
  { question_id: 2, question: 'T2', type: 'theory' as const },
  { question_id: 3, question: 'C1', type: 'code' as const },
  { question_id: 4, question: 'C2', type: 'code' as const },
  { question_id: 5, question: 'C3', type: 'code' as const },
];

const CARD = { concept: 'x' } as Card;

function run(actions: Action[]) {
  return actions.reduce(sessionReducer, initialState);
}

const start: Action = {
  type: 'INIT_SESSION',
  payload: { session_id: 1, stack: 'React', level: 'Básico', topic: 'Hooks', questions: QUESTIONS },
};

describe('sessionReducer with 5 questions (2 theory + 3 code)', () => {
  it('initializes the five questions in order, theory first', () => {
    const state = run([start]);
    expect(state.questions).toHaveLength(5);
    expect(state.questions.map((q) => q.type)).toEqual(['theory', 'theory', 'code', 'code', 'code']);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.currentPhase).toBe('answering');
  });

  it('advances through every question and completes only after the fifth', () => {
    let state = run([start]);
    for (let i = 0; i < 4; i++) {
      state = sessionReducer(state, { type: 'CARD_DISCARDED' });
      expect(state.currentQuestionIndex).toBe(i + 1);
      expect(state.currentPhase).toBe('answering');
    }
    state = sessionReducer(state, { type: 'CARD_DISCARDED' });
    expect(state.currentPhase).toBe('complete');
  });

  it('keeps the answer and feedback of each question separate', () => {
    let state = run([start]);
    for (let i = 0; i < 5; i++) {
      state = sessionReducer(state, { type: 'ANSWER_CHANGED', payload: `answer ${i}` });
      state = sessionReducer(state, { type: 'ANSWER_SUBMITTED' });
      state = sessionReducer(state, {
        type: 'FEEDBACK_RECEIVED',
        payload: { feedback: `feedback ${i}`, result: 'CORRECT', card: CARD },
      });
      state = sessionReducer(state, { type: 'CARD_SAVED' });
    }
    expect(state.currentPhase).toBe('complete');
    expect(state.questions.map((q) => q.answer)).toEqual([0, 1, 2, 3, 4].map((i) => `answer ${i}`));
    expect(state.questions.map((q) => q.feedback)).toEqual([0, 1, 2, 3, 4].map((i) => `feedback ${i}`));
  });
});

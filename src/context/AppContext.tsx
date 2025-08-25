import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AppAction, PracticeSession } from '@/types/app';
import { mockUser, mockAnalytics } from '@/mock/data';

const initialState: AppState = {
  currentPage: '/dashboard',
  user: mockUser,
  practiceSession: null,
  analytics: mockAnalytics,
  selectedFilters: {
    practiceTab: 'Full Tests',
    subject: '',
    topic: '',
    difficulty: '',
    timePeriod: '30'
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_PRACTICE_TAB':
      return {
        ...state,
        selectedFilters: { ...state.selectedFilters, practiceTab: action.payload }
      };

    case 'SET_SUBJECT_FILTER':
      return {
        ...state,
        selectedFilters: { ...state.selectedFilters, subject: action.payload }
      };

    case 'SET_TOPIC_FILTER':
      return {
        ...state,
        selectedFilters: { ...state.selectedFilters, topic: action.payload }
      };

    case 'SET_DIFFICULTY_FILTER':
      return {
        ...state,
        selectedFilters: { ...state.selectedFilters, difficulty: action.payload }
      };

    case 'SET_TIME_PERIOD':
      return {
        ...state,
        selectedFilters: { ...state.selectedFilters, timePeriod: action.payload }
      };

    case 'START_SESSION': {
      const session: PracticeSession = {
        ...action.payload,
        id: `session_${Date.now()}`,
        userAnswers: {},
        currentQuestion: 0,
        startTime: new Date(),
        sessionTime: 0,
        isPaused: false,
        isCompleted: false
      };
      return { ...state, practiceSession: session };
    }

    case 'ANSWER_QUESTION':
      if (!state.practiceSession) return state;
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          userAnswers: {
            ...state.practiceSession.userAnswers,
            [action.payload.questionId]: action.payload.answer
          }
        }
      };

    case 'GO_TO_QUESTION':
      if (!state.practiceSession) return state;
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          currentQuestion: action.payload
        }
      };

    case 'TOGGLE_FLAG':
      if (!state.practiceSession) return state;
      const currentAnswer = state.practiceSession.userAnswers[action.payload];
      const updatedAnswer = currentAnswer 
        ? { ...currentAnswer, isFlagged: !currentAnswer.isFlagged }
        : { questionId: action.payload, selectedAnswer: 'A' as const, timeSpent: 0, isFlagged: true };
      
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          userAnswers: {
            ...state.practiceSession.userAnswers,
            [action.payload]: updatedAnswer
          }
        }
      };

    case 'PAUSE_SESSION':
      if (!state.practiceSession) return state;
      return {
        ...state,
        practiceSession: { ...state.practiceSession, isPaused: true }
      };

    case 'RESUME_SESSION':
      if (!state.practiceSession) return state;
      return {
        ...state,
        practiceSession: { ...state.practiceSession, isPaused: false }
      };

    case 'TICK_TIMER':
      if (!state.practiceSession || state.practiceSession.isPaused) return state;
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          sessionTime: state.practiceSession.sessionTime + 1
        }
      };

    case 'COMPLETE_SESSION':
      if (!state.practiceSession) return state;
      
      const answeredQuestions = Object.keys(state.practiceSession.userAnswers).length;
      const correctAnswers = Object.entries(state.practiceSession.userAnswers)
        .filter(([questionId, answer]) => {
          const question = state.practiceSession?.questions.find(q => q.id === questionId);
          return question && answer.selectedAnswer === question.correctAnswer;
        }).length;
      
      const score = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
      
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          endTime: new Date(),
          isCompleted: true,
          score
        }
      };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.practiceSession) {
      localStorage.setItem('practiceSession', JSON.stringify(state.practiceSession));
    }
  }, [state.practiceSession]);

  // Timer effect
  useEffect(() => {
    if (state.practiceSession && !state.practiceSession.isPaused && !state.practiceSession.isCompleted) {
      const timer = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [state.practiceSession?.isPaused, state.practiceSession?.isCompleted]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
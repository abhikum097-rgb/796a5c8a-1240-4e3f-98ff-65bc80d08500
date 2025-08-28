import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, AppAction, PracticeSession, User, AnalyticsData } from '@/types/app';
import { mockUser, mockAnalytics } from '@/mock/data';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

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

      // Create session in backend (fire and forget)
      supabase.functions.invoke('create-session', {
        body: {
          sessionType: action.payload.sessionType,
          testType: action.payload.testType,
          subject: action.payload.subject,
          topic: action.payload.topic,
          difficulty: action.payload.difficulty,
          questionsData: action.payload.questions
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error creating session:', error);
        } else {
          console.log('Session created in backend:', data);
        }
      });

      return { ...state, practiceSession: session };
    }

    case 'ANSWER_QUESTION': {
      if (!state.practiceSession) return state;
      
      const { questionId, answer } = action.payload;
      const currentQuestion = state.practiceSession.questions.find(q => q.id === questionId);
      const isCorrect = currentQuestion ? answer.selectedAnswer === currentQuestion.correctAnswer : false;
      
      // Submit answer to backend (fire and forget)
      if (state.practiceSession.id) {
        supabase.functions.invoke('submit-answer', {
          body: {
            sessionId: state.practiceSession.id,
            questionId: questionId,
            userAnswer: answer.selectedAnswer,
            timeSpent: answer.timeSpent,
            isCorrect: isCorrect,
            isFlagged: answer.isFlagged,
            confidenceLevel: answer.confidence
          }
        }).then(({ error }) => {
          if (error) {
            console.error('Error submitting answer:', error);
          }
        });
      }

      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          userAnswers: {
            ...state.practiceSession.userAnswers,
            [questionId]: answer
          }
        }
      };
    }

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

    case 'COMPLETE_SESSION': {
      if (!state.practiceSession) return state;
      
      const answeredQuestions = Object.keys(state.practiceSession.userAnswers).length;
      const correctAnswers = Object.entries(state.practiceSession.userAnswers)
        .filter(([questionId, answer]) => {
          const question = state.practiceSession?.questions.find(q => q.id === questionId);
          return question && answer.selectedAnswer === question.correctAnswer;
        }).length;
      
      const score = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
      
      // Complete session in backend (fire and forget)
      if (state.practiceSession.id) {
        supabase.functions.invoke('complete-session', {
          body: {
            sessionId: state.practiceSession.id,
            totalTimeSpent: state.practiceSession.sessionTime
          }
        }).then(({ error }) => {
          if (error) {
            console.error('Error completing session:', error);
          }
        });
      }
      
      return {
        ...state,
        practiceSession: {
          ...state.practiceSession,
          endTime: new Date(),
          isCompleted: true,
          score
        }
      };
    }

    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: action.payload
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
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
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user analytics when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchUserAnalytics();
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserAnalytics();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user analytics from backend with error handling
  const fetchUserAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics');
      
      if (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Analytics Error",
          description: "Unable to load your analytics data. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        dispatch({
          type: 'UPDATE_ANALYTICS',
          payload: {
            overallStats: data.overallStats,
            performanceBySubject: data.performanceBySubject,
            scoreHistory: data.scoreHistory
          }
        });

        // Update user profile in state
        if (data.profile) {
          dispatch({
            type: 'UPDATE_USER',
            payload: {
              id: data.profile.id,
              firstName: data.profile.first_name || 'User',
              lastName: data.profile.last_name || '',
              email: user?.email || '',
              subscriptionTier: data.profile.subscription_tier || 'free',
              selectedTest: data.profile.selected_test || 'SHSAT',
              studyStreak: data.profile.study_streak || 0,
              totalStudyTime: data.profile.total_study_time || 0,
              createdAt: new Date(data.profile.created_at)
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
    }
  };

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
    <AppContext.Provider value={{ 
      state: { 
        ...state, 
        user: user ? { ...state.user, email: user.email } : state.user 
      }, 
      dispatch 
    }}>
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


import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, AppAction, PracticeSession, User, AnalyticsData } from '@/types/app';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const initialState: AppState = {
  currentPage: '/dashboard',
  user: null,
  practiceSession: null,
  analytics: {
    overallStats: {
      totalQuestions: 0,
      averageScore: 0,
      studyStreak: 0,
      timeSpentThisWeek: 0
    },
    performanceBySubject: [],
    scoreHistory: []
  },
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

    case 'ANSWER_QUESTION': {
      if (!state.practiceSession) return state;
      
      const { questionId, answer } = action.payload;
      const currentQuestion = state.practiceSession.questions.find(q => q.id === questionId);
      const isCorrect = currentQuestion ? answer.selectedAnswer === currentQuestion.correctAnswer : false;
      
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update user in app state when authenticated
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user);
          }, 0);
        } else {
          // Clear user data when logged out
          dispatch({
            type: 'UPDATE_USER',
            payload: null
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile and analytics
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      // Update user in app state
      const appUser: User = {
        id: supabaseUser.id,
        firstName: profile?.first_name || 'User',
        lastName: profile?.last_name || '',
        email: supabaseUser.email || '',
        subscriptionTier: profile?.subscription_tier || 'free',
        selectedTest: profile?.selected_test || 'SHSAT',
        studyStreak: profile?.study_streak || 0,
        totalStudyTime: profile?.total_study_time || 0,
        createdAt: new Date(profile?.created_at || supabaseUser.created_at)
      };

      dispatch({
        type: 'UPDATE_USER',
        payload: appUser
      });

      // Fetch analytics
      fetchUserAnalytics();
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Fetch user analytics from backend
  const fetchUserAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics');
      
      if (error) {
        console.error('Error fetching analytics:', error);
        return;
      }

      if (data) {
        dispatch({
          type: 'UPDATE_ANALYTICS',
          payload: {
            overallStats: data.overallStats || initialState.analytics.overallStats,
            performanceBySubject: data.performanceBySubject || [],
            scoreHistory: data.scoreHistory || []
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // Auto-save practice session to localStorage
  useEffect(() => {
    if (state.practiceSession && !state.practiceSession.isCompleted) {
      localStorage.setItem('practiceSession', JSON.stringify(state.practiceSession));
    } else {
      localStorage.removeItem('practiceSession');
    }
  }, [state.practiceSession]);

  // Timer effect for practice sessions
  useEffect(() => {
    if (state.practiceSession && !state.practiceSession.isPaused && !state.practiceSession.isCompleted) {
      const timer = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [state.practiceSession?.isPaused, state.practiceSession?.isCompleted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ServerSession {
  id: string;
  user_id: string;
  session_type: string;
  test_type: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  total_questions: number;
  current_question_index: number;
  questions_order: string[];
  status: string; // Allow any string from database
  start_time: string;
  end_time?: string;
  total_time_spent: number;
  created_at: string;
  // Additional fields that might come from database
  score?: number;
  percentage_correct?: number;
  practice_set_id?: string;
}

export const useServerSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ServerSession | null>(null);
  const { user } = useAuth();

  const createSession = useCallback(async (params: {
    sessionType: string;
    testType: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    questionsData?: any[];
  }) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-session', {
        body: params
      });

      if (error) {
        throw new Error(error.message || 'Failed to create session');
      }

      setSession(data.session);
      return { session: data.session, questions: data.questions };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error('Session not found');
      }

      setSession(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitAnswer = useCallback(async (params: {
    sessionId: string;
    questionId: string;
    userAnswer: string;
    timeSpent: number;
    isFlagged?: boolean;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('submit-answer', {
        body: params
      });

      if (error) {
        console.error('Error submitting answer:', error);
        toast({
          title: "Auto-save failed",
          description: "Your answer couldn't be saved automatically.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  }, [user]);

  const updateSessionProgress = useCallback(async (sessionId: string, currentQuestionIndex: number) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .update({ 
          current_question_index: currentQuestionIndex,
          total_time_spent: Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000)
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating session progress:', error);
      }
    } catch (err) {
      console.error('Error updating session progress:', err);
    }
  }, [user, session]);

  return {
    session,
    loading,
    error,
    createSession,
    loadSession,
    submitAnswer,
    updateSessionProgress
  };
};
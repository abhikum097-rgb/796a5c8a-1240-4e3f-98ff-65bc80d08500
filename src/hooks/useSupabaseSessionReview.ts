import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionReviewQuestion {
  id: string;
  question_text: string;
  question_images: string[];
  passage?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty_level: string;
  topic: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  confidenceLevel?: string;
  isFlagged?: boolean;
}

interface SessionReviewData {
  session: any;
  questions: SessionReviewQuestion[];
  totalQuestions: number;
}

export const useSupabaseSessionReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionReview = useCallback(async (sessionId: string): Promise<SessionReviewData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-session-review', {
        body: { sessionId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch session review');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching session review:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchSessionReview,
    loading,
    error
  };
};
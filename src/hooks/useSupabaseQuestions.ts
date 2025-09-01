import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/app';

interface QuestionFilters {
  subject?: string;
  topic?: string;
  difficulty?: string;
  testType?: string;
  count?: number;
  avoidRecent?: boolean;
  sessionId?: string;
}

export const useSupabaseQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (filters: QuestionFilters = {}): Promise<Question[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-questions', {
        body: filters
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch questions');
      }

      // Map snake_case database columns to camelCase Question type
      const questions = (data?.questions || []).map((dbQuestion: any): Question => ({
        id: dbQuestion.id,
        testType: dbQuestion.test_type,
        subject: dbQuestion.subject,
        topic: dbQuestion.topic,
        difficulty: dbQuestion.difficulty_level,
        questionText: dbQuestion.question_text,
        options: {
          A: dbQuestion.option_a,
          B: dbQuestion.option_b,
          C: dbQuestion.option_c,
          D: dbQuestion.option_d
        },
        correctAnswer: dbQuestion.correct_answer,
        explanation: dbQuestion.explanation,
        timeAllocated: dbQuestion.time_allocated || 60
      }));

      return questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching questions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchQuestions,
    loading,
    error
  };
};
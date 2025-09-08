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
  strict?: boolean;
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

      // SECURITY: Map database columns to safe Question type (NO ANSWERS OR EXPLANATIONS during practice)
      const questions = (data?.questions || []).map((dbQuestion: any): Question => ({
        id: dbQuestion.id,
        testType: dbQuestion.test_type,
        subject: dbQuestion.subject,
        topic: dbQuestion.topic,
        difficulty: dbQuestion.difficulty_level,
        questionText: dbQuestion.question_text,
        questionImages: Array.isArray(dbQuestion.question_images) ? dbQuestion.question_images : [],
        passage: dbQuestion.passage || undefined, // Include passage for reading questions
        options: {
          A: dbQuestion.option_a,
          B: dbQuestion.option_b,
          C: dbQuestion.option_c,
          D: dbQuestion.option_d
        },
        // SECURITY: Never expose correct answers or explanations during practice
        correctAnswer: 'HIDDEN',
        explanation: 'Available after session completion',
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
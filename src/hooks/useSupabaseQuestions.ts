import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/app';

interface QuestionFilters {
  subject?: string;
  topic?: string;
  difficulty?: string;
  testType?: string;
  count?: number;
}

export const useSupabaseQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (filters: QuestionFilters = {}): Promise<Question[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters.count) params.set('count', filters.count.toString());
      if (filters.testType) params.set('testType', filters.testType);
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.topic) params.set('topic', filters.topic);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);

      const { data, error } = await supabase.functions.invoke('get-questions', {
        body: Object.fromEntries(params)
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch questions');
      }

      return data?.questions || [];
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
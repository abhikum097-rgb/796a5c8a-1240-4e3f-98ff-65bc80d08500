import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Topic {
  topic: string;
  question_count: number;
}

export const useSupabaseTopics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async (testType: string, subject?: string): Promise<Topic[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-topics', {
        body: { testType, subject }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch topics');
      }

      return data?.topics || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching topics:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchTopics,
    loading,
    error
  };
};
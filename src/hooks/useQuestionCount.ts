import { useState, useEffect } from 'react';
import { useSupabaseQuestions } from './useSupabaseQuestions';
import { useAuth } from './useAuth';

interface QuestionCountFilters {
  testType: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

export const useQuestionCount = (filters: QuestionCountFilters) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { fetchQuestions } = useSupabaseQuestions();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const getCount = async () => {
      if (!filters.testType) return;
      
      // Skip count for unauthenticated users
      if (!isAuthenticated) {
        setCount(0);
        return;
      }
      
      setLoading(true);
      try {
        const questions = await fetchQuestions({
          testType: filters.testType,
          subject: filters.subject !== 'all' ? filters.subject : undefined,
          topic: filters.topic !== 'all' ? filters.topic : undefined,
          difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined,
          count: 1000, // Get a large number to count available questions
        });
        setCount(questions.length);
      } catch (error) {
        console.error('Error getting question count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    getCount();
  }, [filters.testType, filters.subject, filters.topic, filters.difficulty, fetchQuestions, isAuthenticated]);

  return { count, loading };
};
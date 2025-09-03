import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecentPracticeSession {
  id: string;
  created_at: string;
  test_type: string;
  session_type: string;
  score: number | null;
  total_questions: number;
  status: string;
  subject: string | null;
  topic: string | null;
}

export const useRecentPractice = (limit: number = 5) => {
  const [sessions, setSessions] = useState<RecentPracticeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      return;
    }

    const fetchRecentSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('practice_sessions')
          .select('id, created_at, test_type, session_type, score, total_questions, status, subject, topic')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching recent practice sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, [isAuthenticated, limit]);

  return { sessions, loading };
};
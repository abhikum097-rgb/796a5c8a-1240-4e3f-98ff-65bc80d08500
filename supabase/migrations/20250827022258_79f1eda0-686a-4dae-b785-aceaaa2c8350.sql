-- Fix security issues from linter

-- Enable RLS on public tables (questions and practice_sets should be readable by everyone but only admins can modify)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for questions table (read-only for all users)
CREATE POLICY "Anyone can view active questions" ON public.questions
  FOR SELECT USING (is_active = true);

-- Create policies for practice_sets table (read-only for all users)  
CREATE POLICY "Anyone can view practice sets" ON public.practice_sets
  FOR SELECT USING (true);

-- Fix function search paths by updating existing functions
CREATE OR REPLACE FUNCTION public.update_user_analytics(p_user_id UUID, p_session_id UUID)
RETURNS void AS $$
DECLARE
  session_record RECORD;
  correct_answers INTEGER;
  total_time INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO session_record FROM public.practice_sessions WHERE id = p_session_id;
  
  -- Calculate correct answers and total time
  SELECT 
    COUNT(*) FILTER (WHERE is_correct = true),
    SUM(time_spent)
  INTO correct_answers, total_time
  FROM public.user_answers
  WHERE session_id = p_session_id;
  
  -- Update or insert analytics record
  INSERT INTO public.user_analytics (
    user_id, test_type, subject, topic, 
    total_attempted, total_correct, sessions_completed,
    avg_time_per_question, total_time_spent, last_practiced
  )
  VALUES (
    p_user_id,
    session_record.test_type,
    session_record.subject,
    session_record.topic,
    session_record.total_questions,
    correct_answers,
    1,
    CASE WHEN session_record.total_questions > 0 THEN total_time::decimal / session_record.total_questions ELSE 0 END,
    total_time / 60, -- convert to minutes
    NOW()
  )
  ON CONFLICT (user_id, test_type, subject, topic) 
  DO UPDATE SET
    total_attempted = user_analytics.total_attempted + EXCLUDED.total_attempted,
    total_correct = user_analytics.total_correct + EXCLUDED.total_correct,
    sessions_completed = user_analytics.sessions_completed + 1,
    avg_time_per_question = (
      (user_analytics.avg_time_per_question * user_analytics.total_attempted + EXCLUDED.avg_time_per_question * EXCLUDED.total_attempted) /
      (user_analytics.total_attempted + EXCLUDED.total_attempted)
    ),
    total_time_spent = user_analytics.total_time_spent + EXCLUDED.total_time_spent,
    last_practiced = NOW(),
    updated_at = NOW();
    
  -- Update mastery level based on accuracy
  UPDATE public.user_analytics
  SET mastery_level = CASE
    WHEN accuracy_percentage >= 95 THEN 'Expert'
    WHEN accuracy_percentage >= 85 THEN 'Advanced'
    WHEN accuracy_percentage >= 75 THEN 'Proficient'
    WHEN accuracy_percentage >= 65 THEN 'Intermediate'
    WHEN accuracy_percentage >= 50 THEN 'Basic'
    ELSE 'Beginner'
  END
  WHERE user_id = p_user_id AND test_type = session_record.test_type 
    AND subject = session_record.subject AND topic = session_record.topic;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
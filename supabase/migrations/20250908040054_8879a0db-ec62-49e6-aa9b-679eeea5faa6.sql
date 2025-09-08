-- Add unique constraint to prevent duplicate user answers
ALTER TABLE public.user_answers 
ADD CONSTRAINT user_answers_session_question_unique 
UNIQUE (session_id, question_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON public.user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON public.practice_sessions(status);

-- Update accuracy percentage calculation in user_analytics
CREATE OR REPLACE FUNCTION public.calculate_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate accuracy percentage
  NEW.accuracy_percentage = CASE 
    WHEN NEW.total_attempted > 0 THEN 
      ROUND((NEW.total_correct::decimal / NEW.total_attempted::decimal) * 100, 2)
    ELSE 0 
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate accuracy
DROP TRIGGER IF EXISTS trigger_calculate_accuracy ON public.user_analytics;
CREATE TRIGGER trigger_calculate_accuracy
  BEFORE INSERT OR UPDATE ON public.user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_accuracy();
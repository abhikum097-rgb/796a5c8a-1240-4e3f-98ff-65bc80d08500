-- Add indexes for better question retrieval performance
CREATE INDEX IF NOT EXISTS idx_questions_test_subject_topic_difficulty 
ON questions(test_type, subject, topic, difficulty_level, is_active);

CREATE INDEX IF NOT EXISTS idx_questions_active_lookup 
ON questions(is_active, test_type, subject) 
WHERE is_active = true;

-- Create table for tracking user question history to prevent repetition
CREATE TABLE IF NOT EXISTS user_question_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  session_id uuid,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  times_seen integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for user_question_history
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question history" 
ON user_question_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question history" 
ON user_question_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question history" 
ON user_question_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate history entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_question_history_unique 
ON user_question_history(user_id, question_id);

-- Add index for efficient history lookups
CREATE INDEX IF NOT EXISTS idx_user_question_history_lookup 
ON user_question_history(user_id, last_seen_at DESC);

-- Create function to get topics by test and subject
CREATE OR REPLACE FUNCTION get_available_topics(p_test_type text, p_subject text DEFAULT NULL)
RETURNS TABLE(topic text, question_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    q.topic,
    COUNT(*) as question_count
  FROM questions q
  WHERE q.is_active = true 
    AND q.test_type = p_test_type
    AND (p_subject IS NULL OR q.subject = p_subject)
  GROUP BY q.topic
  HAVING COUNT(*) > 0
  ORDER BY q.topic;
$$;

-- Create function to get question distribution stats
CREATE OR REPLACE FUNCTION get_question_stats(p_test_type text, p_subject text DEFAULT NULL, p_topic text DEFAULT NULL)
RETURNS TABLE(
  test_type text,
  subject text, 
  topic text,
  difficulty_level text,
  question_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    q.test_type,
    q.subject,
    q.topic,
    q.difficulty_level,
    COUNT(*) as question_count
  FROM questions q
  WHERE q.is_active = true 
    AND q.test_type = p_test_type
    AND (p_subject IS NULL OR q.subject = p_subject)
    AND (p_topic IS NULL OR q.topic = p_topic)
  GROUP BY q.test_type, q.subject, q.topic, q.difficulty_level
  ORDER BY q.subject, q.topic, q.difficulty_level;
$$;
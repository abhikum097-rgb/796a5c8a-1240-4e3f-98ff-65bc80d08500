-- Fix security issues in functions by setting search_path
CREATE OR REPLACE FUNCTION get_available_topics(p_test_type text, p_subject text DEFAULT NULL)
RETURNS TABLE(topic text, question_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
SECURITY DEFINER
SET search_path = public
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
-- Add database optimizations for questions table
CREATE INDEX IF NOT EXISTS idx_questions_test_type_subject_topic ON public.questions (test_type, subject, topic, difficulty_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions (is_active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions (created_at);

-- Add updated_at trigger for questions table
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to prevent exact duplicates
ALTER TABLE public.questions 
ADD CONSTRAINT unique_question_content 
UNIQUE (test_type, subject, topic, question_text, option_a, option_b, option_c, option_d, correct_answer);

-- Add validation for correct_answer
ALTER TABLE public.questions 
ADD CONSTRAINT valid_correct_answer 
CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
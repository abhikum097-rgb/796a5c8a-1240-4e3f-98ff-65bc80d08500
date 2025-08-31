-- Add database optimizations for questions table (with IF NOT EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_questions_test_type_subject_topic ON public.questions (test_type, subject, topic, difficulty_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions (is_active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions (created_at);

-- Add unique constraint to prevent exact duplicates (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_question_content'
    ) THEN
        ALTER TABLE public.questions 
        ADD CONSTRAINT unique_question_content 
        UNIQUE (test_type, subject, topic, question_text, option_a, option_b, option_c, option_d, correct_answer);
    END IF;
END $$;

-- Add validation for correct_answer (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_correct_answer'
    ) THEN
        ALTER TABLE public.questions 
        ADD CONSTRAINT valid_correct_answer 
        CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
    END IF;
END $$;
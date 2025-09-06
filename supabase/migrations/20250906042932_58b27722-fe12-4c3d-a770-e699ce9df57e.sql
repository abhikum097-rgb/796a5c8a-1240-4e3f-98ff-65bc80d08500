-- Add passage column to questions table for reading comprehension
ALTER TABLE public.questions ADD COLUMN passage TEXT;

-- Add comment to explain the new column
COMMENT ON COLUMN public.questions.passage IS 'Reading passage text for comprehension questions. NULL for non-reading questions.';
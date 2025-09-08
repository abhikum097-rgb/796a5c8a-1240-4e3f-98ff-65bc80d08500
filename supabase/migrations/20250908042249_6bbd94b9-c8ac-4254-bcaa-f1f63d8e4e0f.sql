-- Security hardening: Restrict practice_sets visibility and improve admin authorization

-- 1. Restrict practice_sets table - change from public to authenticated users only
DROP POLICY IF EXISTS "Anyone can view practice sets" ON public.practice_sets;

CREATE POLICY "Authenticated users can view practice sets" 
ON public.practice_sets 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Add rate limiting table for AI functions to prevent abuse
CREATE TABLE IF NOT EXISTS public.ai_function_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_function_usage
ALTER TABLE public.ai_function_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_function_usage
CREATE POLICY "Users can view own usage stats" 
ON public.ai_function_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage stats" 
ON public.ai_function_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage stats" 
ON public.ai_function_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to check and update AI function usage
CREATE OR REPLACE FUNCTION public.check_ai_function_limit(
  p_function_name TEXT,
  p_daily_limit INTEGER DEFAULT 50
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  -- Get current usage for today
  SELECT COALESCE(call_count, 0) INTO current_usage
  FROM public.ai_function_usage
  WHERE user_id = auth.uid()
    AND function_name = p_function_name
    AND date = CURRENT_DATE;
  
  -- Check if limit exceeded
  IF current_usage >= p_daily_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Update or insert usage record
  INSERT INTO public.ai_function_usage (user_id, function_name, call_count, date)
  VALUES (auth.uid(), p_function_name, 1, CURRENT_DATE)
  ON CONFLICT (user_id, function_name, date) 
  DO UPDATE SET 
    call_count = ai_function_usage.call_count + 1,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Add unique constraint for usage tracking
ALTER TABLE public.ai_function_usage 
ADD CONSTRAINT unique_user_function_date 
UNIQUE (user_id, function_name, date);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_function_usage_updated_at
BEFORE UPDATE ON public.ai_function_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
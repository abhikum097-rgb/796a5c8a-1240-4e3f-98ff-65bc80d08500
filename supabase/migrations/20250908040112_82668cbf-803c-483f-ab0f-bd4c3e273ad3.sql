-- Fix the search path security issue for calculate_accuracy function
CREATE OR REPLACE FUNCTION public.calculate_accuracy()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate accuracy percentage
  NEW.accuracy_percentage = CASE 
    WHEN NEW.total_attempted > 0 THEN 
      ROUND((NEW.total_correct::decimal / NEW.total_attempted::decimal) * 100, 2)
    ELSE 0 
  END;
  
  RETURN NEW;
END;
$$;
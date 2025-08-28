
-- Tighten RLS on questions table - require authentication
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.questions;
CREATE POLICY "Authenticated users can view active questions" 
  ON public.questions 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Tighten RLS on practice_sets table - require authentication  
DROP POLICY IF EXISTS "Anyone can view practice sets" ON public.practice_sets;
CREATE POLICY "Authenticated users can view practice sets"
  ON public.practice_sets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add updated_at triggers for tables that don't have them
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

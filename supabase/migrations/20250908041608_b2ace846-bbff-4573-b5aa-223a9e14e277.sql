-- Security hardening migration

-- 1. Lock down questions table - remove public access and add authenticated-only access
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.questions;

CREATE POLICY "Authenticated users can view active questions" 
ON public.questions 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- 2. Secure documents storage bucket - make it private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- 3. Create storage policies for documents bucket
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Add NOT NULL constraints to user_id columns
ALTER TABLE public.practice_sessions 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_analytics 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.subscriptions 
ALTER COLUMN user_id SET NOT NULL;

-- 5. Add trigger for handle_new_user if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
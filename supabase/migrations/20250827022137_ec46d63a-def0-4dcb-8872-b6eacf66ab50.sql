-- Create user profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  grade_level INTEGER,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'single_test', 'all_access')),
  selected_test VARCHAR(10) CHECK (selected_test IN ('SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS')),
  subscription_expires_at TIMESTAMPTZ,
  study_streak INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS')),
  subject VARCHAR(20) NOT NULL CHECK (subject IN ('Math', 'Verbal', 'Reading', 'Writing')),
  topic VARCHAR(50) NOT NULL,
  sub_topic VARCHAR(50),
  difficulty_level VARCHAR(10) NOT NULL CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
  question_text TEXT NOT NULL,
  question_images TEXT[], -- Array of image URLs
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  time_allocated INTEGER DEFAULT 60, -- seconds
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice sets table
CREATE TABLE public.practice_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  test_type VARCHAR(10) NOT NULL,
  set_type VARCHAR(20) NOT NULL CHECK (set_type IN ('full_test', 'subject_practice', 'topic_practice', 'mixed_review')),
  total_questions INTEGER NOT NULL,
  time_limit INTEGER, -- minutes
  subjects_included TEXT[], -- ['Math', 'Verbal']
  topics_included TEXT[], -- ['Algebra', 'Geometry']
  difficulty_mix JSONB, -- {"Easy": 10, "Medium": 15, "Hard": 5}
  is_randomized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice sessions table
CREATE TABLE public.practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  practice_set_id UUID REFERENCES public.practice_sets(id),
  session_type VARCHAR(20) NOT NULL,
  test_type VARCHAR(10),
  subject VARCHAR(20),
  topic VARCHAR(50),
  difficulty VARCHAR(10),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused', 'abandoned')),
  current_question_index INTEGER DEFAULT 0,
  questions_order UUID[], -- Array of question IDs in order
  total_questions INTEGER NOT NULL,
  score INTEGER,
  percentage_correct DECIMAL(5,2),
  total_time_spent INTEGER DEFAULT 0, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user answers table
CREATE TABLE public.user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id),
  user_answer CHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  confidence_level VARCHAR(10) CHECK (confidence_level IN ('Low', 'Medium', 'High')),
  time_spent INTEGER NOT NULL, -- seconds
  is_flagged BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user analytics table
CREATE TABLE public.user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  test_type VARCHAR(10),
  subject VARCHAR(20),
  topic VARCHAR(50),
  total_attempted INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_attempted > 0 THEN (total_correct::decimal / total_attempted::decimal) * 100
      ELSE 0
    END
  ) STORED,
  avg_time_per_question DECIMAL(6,2) DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- minutes
  last_practiced TIMESTAMPTZ,
  mastery_level VARCHAR(20) DEFAULT 'Beginner' CHECK (mastery_level IN ('Beginner', 'Basic', 'Intermediate', 'Proficient', 'Advanced', 'Expert')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, test_type, subject, topic)
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id VARCHAR(50) UNIQUE,
  stripe_customer_id VARCHAR(50),
  subscription_tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Questions and practice_sets are public (no RLS needed for read access)

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Practice sessions policies
CREATE POLICY "Users can view own sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- User answers policies
CREATE POLICY "Users can view own answers" ON public.user_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions 
      WHERE id = user_answers.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers" ON public.user_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_sessions 
      WHERE id = user_answers.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers" ON public.user_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions 
      WHERE id = user_answers.session_id AND user_id = auth.uid()
    )
  );

-- User analytics policies
CREATE POLICY "Users can view own analytics" ON public.user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.user_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_questions_test_subject_topic ON public.questions(test_type, subject, topic);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_questions_active ON public.questions(is_active) WHERE is_active = true;

CREATE INDEX idx_sessions_user_status ON public.practice_sessions(user_id, status);
CREATE INDEX idx_sessions_created_at ON public.practice_sessions(created_at DESC);

CREATE INDEX idx_answers_session ON public.user_answers(session_id);
CREATE INDEX idx_answers_question ON public.user_answers(question_id);

CREATE INDEX idx_analytics_user_subject ON public.user_analytics(user_id, subject);
CREATE INDEX idx_analytics_mastery ON public.user_analytics(mastery_level);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user analytics after session completion
CREATE OR REPLACE FUNCTION public.update_user_analytics(p_user_id UUID, p_session_id UUID)
RETURNS void AS $$
DECLARE
  session_record RECORD;
  correct_answers INTEGER;
  total_time INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO session_record FROM public.practice_sessions WHERE id = p_session_id;
  
  -- Calculate correct answers and total time
  SELECT 
    COUNT(*) FILTER (WHERE is_correct = true),
    SUM(time_spent)
  INTO correct_answers, total_time
  FROM public.user_answers
  WHERE session_id = p_session_id;
  
  -- Update or insert analytics record
  INSERT INTO public.user_analytics (
    user_id, test_type, subject, topic, 
    total_attempted, total_correct, sessions_completed,
    avg_time_per_question, total_time_spent, last_practiced
  )
  VALUES (
    p_user_id,
    session_record.test_type,
    session_record.subject,
    session_record.topic,
    session_record.total_questions,
    correct_answers,
    1,
    CASE WHEN session_record.total_questions > 0 THEN total_time::decimal / session_record.total_questions ELSE 0 END,
    total_time / 60, -- convert to minutes
    NOW()
  )
  ON CONFLICT (user_id, test_type, subject, topic) 
  DO UPDATE SET
    total_attempted = user_analytics.total_attempted + EXCLUDED.total_attempted,
    total_correct = user_analytics.total_correct + EXCLUDED.total_correct,
    sessions_completed = user_analytics.sessions_completed + 1,
    avg_time_per_question = (
      (user_analytics.avg_time_per_question * user_analytics.total_attempted + EXCLUDED.avg_time_per_question * EXCLUDED.total_attempted) /
      (user_analytics.total_attempted + EXCLUDED.total_attempted)
    ),
    total_time_spent = user_analytics.total_time_spent + EXCLUDED.total_time_spent,
    last_practiced = NOW(),
    updated_at = NOW();
    
  -- Update mastery level based on accuracy
  UPDATE public.user_analytics
  SET mastery_level = CASE
    WHEN accuracy_percentage >= 95 THEN 'Expert'
    WHEN accuracy_percentage >= 85 THEN 'Advanced'
    WHEN accuracy_percentage >= 75 THEN 'Proficient'
    WHEN accuracy_percentage >= 65 THEN 'Intermediate'
    WHEN accuracy_percentage >= 50 THEN 'Basic'
    ELSE 'Beginner'
  END
  WHERE user_id = p_user_id AND test_type = session_record.test_type 
    AND subject = session_record.subject AND topic = session_record.topic;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample questions
INSERT INTO public.questions (test_type, subject, topic, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES 
('SHSAT', 'Math', 'Algebra', 'Easy', 'Solve for x: 3x + 7 = 22', 'x = 3', 'x = 5', 'x = 7', 'x = 9', 'B', 'Subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.'),
('SHSAT', 'Math', 'Algebra', 'Medium', 'If 2x - 5 = 11, what is the value of x + 3?', '8', '11', '13', '19', 'B', 'First solve for x: 2x = 16, so x = 8. Then x + 3 = 8 + 3 = 11.'),
('SHSAT', 'Math', 'Geometry', 'Easy', 'What is the area of a rectangle with length 8 units and width 5 units?', '13 square units', '26 square units', '40 square units', '80 square units', 'C', 'The area of a rectangle is length × width = 8 × 5 = 40 square units.'),
('SHSAT', 'Math', 'Geometry', 'Medium', 'A circle has a radius of 6 cm. What is its circumference?', '12π cm', '18π cm', '36π cm', '6π cm', 'A', 'Circumference = 2πr = 2π(6) = 12π cm.'),
('SHSAT', 'Verbal', 'Vocabulary', 'Easy', 'Choose the word that best completes the sentence: The scientist''s theory was so _______ that even experts had difficulty understanding it.', 'simple', 'complex', 'popular', 'obvious', 'B', 'The sentence indicates difficulty understanding, suggesting "complex".'),
('SHSAT', 'Verbal', 'Vocabulary', 'Medium', 'TENACIOUS most nearly means:', 'Flexible', 'Persistent', 'Careless', 'Temporary', 'B', 'Tenacious means holding firmly to something or persistent in maintaining a position.'),
('SHSAT', 'Verbal', 'Synonyms', 'Easy', 'Which word is most similar to ELATED?', 'Sad', 'Happy', 'Confused', 'Tired', 'B', 'Elated means extremely happy or joyful.'),
('SHSAT', 'Verbal', 'Analogies', 'Medium', 'BOOK is to LIBRARY as PAINTING is to:', 'Frame', 'Museum', 'Artist', 'Canvas', 'B', 'Books are stored and displayed in libraries, just as paintings are stored and displayed in museums.'),
('SHSAT', 'Reading', 'Comprehension', 'Medium', 'Based on the passage, what can be inferred about the author''s attitude toward renewable energy?', 'Strongly opposed', 'Cautiously optimistic', 'Completely neutral', 'Enthusiastically supportive', 'B', 'The author presents both benefits and challenges of renewable energy, suggesting a balanced but hopeful perspective.'),
('SHSAT', 'Reading', 'Inference', 'Hard', 'The passage suggests that the main character''s decision was influenced primarily by:', 'Financial concerns', 'Family pressure', 'Personal values', 'Social expectations', 'C', 'Throughout the passage, the character consistently references their moral principles when making decisions.'),
('SHSAT', 'Math', 'Arithmetic', 'Easy', 'What is 15% of 80?', '12', '15', '20', '25', 'A', '15% of 80 = 0.15 × 80 = 12.'),
('SHSAT', 'Math', 'Arithmetic', 'Medium', 'If a shirt costs $45 after a 25% discount, what was the original price?', '$56.25', '$60', '$67.50', '$70', 'B', 'If the discounted price is 75% of original, then $45 ÷ 0.75 = $60.'),
('SHSAT', 'Math', 'Word Problems', 'Medium', 'A train travels 240 miles in 4 hours. At this rate, how long will it take to travel 360 miles?', '5 hours', '6 hours', '7 hours', '8 hours', 'B', 'Speed = 240 ÷ 4 = 60 mph. Time = 360 ÷ 60 = 6 hours.'),
('SHSAT', 'Verbal', 'Logic', 'Hard', 'All roses are flowers. Some flowers are red. Therefore:', 'All roses are red', 'Some roses are red', 'No roses are red', 'Cannot be determined', 'D', 'We know all roses are flowers and some flowers are red, but we cannot determine if any roses are among the red flowers.'),
('SHSAT', 'Reading', 'Main Ideas', 'Easy', 'What is the main idea of the passage?', 'Technology is harmful', 'Education needs reform', 'Climate change is urgent', 'Exercise improves health', 'D', 'The passage focuses primarily on the various health benefits of regular physical exercise.');

-- Insert sample practice sets
INSERT INTO public.practice_sets (name, description, test_type, set_type, total_questions, time_limit, subjects_included, topics_included) VALUES 
('SHSAT Practice Test 1', 'Complete 89-question practice exam', 'SHSAT', 'full_test', 89, 150, ARRAY['Math','Verbal','Reading'], NULL),
('Math Algebra Practice', 'Focus on algebraic concepts', 'SHSAT', 'topic_practice', 25, 30, ARRAY['Math'], ARRAY['Algebra']),
('Mixed Review - Medium', 'Random questions at medium difficulty', 'SHSAT', 'mixed_review', 30, 40, ARRAY['Math','Verbal','Reading'], NULL),
('Verbal Skills Builder', 'Comprehensive verbal practice', 'SHSAT', 'subject_practice', 35, 45, ARRAY['Verbal'], ARRAY['Vocabulary','Synonyms','Analogies','Logic']),
('Math Geometry Focus', 'Geometry problem solving', 'SHSAT', 'topic_practice', 20, 25, ARRAY['Math'], ARRAY['Geometry']);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_answers;
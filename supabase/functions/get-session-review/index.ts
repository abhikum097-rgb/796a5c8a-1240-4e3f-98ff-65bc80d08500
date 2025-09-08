import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify session belongs to user and is completed
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('Session fetch error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Only allow review for completed sessions
    if (session.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Session must be completed to view review' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get questions with answers and explanations for review
    const questionIds = session.questions_order || [];
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, question_images, passage, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty_level, topic')
      .in('id', questionIds);

    if (questionsError) {
      console.error('Questions fetch error:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user answers for the session
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id, user_answer, is_correct, time_spent, confidence_level, is_flagged')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('User answers fetch error:', answersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user answers' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Map questions to preserve order and include user responses
    const orderedQuestionsWithAnswers = questionIds.map(questionId => {
      const question = questions?.find(q => q.id === questionId);
      const userAnswer = userAnswers?.find(a => a.question_id === questionId);
      
      return {
        ...question,
        userAnswer: userAnswer?.user_answer,
        isCorrect: userAnswer?.is_correct,
        timeSpent: userAnswer?.time_spent,
        confidenceLevel: userAnswer?.confidence_level,
        isFlagged: userAnswer?.is_flagged
      };
    }).filter(Boolean);

    console.log(`Retrieved ${orderedQuestionsWithAnswers.length} questions for review`);

    return new Response(
      JSON.stringify({
        session,
        questions: orderedQuestionsWithAnswers,
        totalQuestions: orderedQuestionsWithAnswers.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
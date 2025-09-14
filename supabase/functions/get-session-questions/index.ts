import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header provided');
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const { sessionId } = body;

    console.log('Fetching safe questions for session:', sessionId);

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sessionError) {
      console.error('Database error fetching session:', sessionError);
      throw new Error(`Database error: ${sessionError.message}`);
    }

    if (!session) {
      console.error('Session not found or access denied for session:', sessionId, 'user:', user.id);
      throw new Error('Session not found or you do not have access to it');
    }

    // Fetch SAFE question data only (no correct answers or explanations)
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        test_type,
        subject,
        topic,
        difficulty_level,
        question_text,
        question_images,
        passage,
        option_a,
        option_b,
        option_c,
        option_d,
        time_allocated
      `)
      .in('id', session.questions_order);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw new Error('Failed to load session questions');
    }

    // Sort questions to match the original order
    const sortedQuestions = session.questions_order.map(qId => 
      questionsData.find(q => q.id === qId)
    ).filter(Boolean);

    console.log(`Fetched ${sortedQuestions.length} safe questions for session`);

    return new Response(
      JSON.stringify({
        questions: sortedQuestions,
        session: {
          id: session.id,
          test_type: session.test_type,
          session_type: session.session_type,
          subject: session.subject,
          topic: session.topic,
          difficulty: session.difficulty,
          current_question_index: session.current_question_index,
          total_questions: session.total_questions,
          start_time: session.start_time,
          end_time: session.end_time,
          total_time_spent: session.total_time_spent,
          status: session.status,
          score: session.score
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-session-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const {
      sessionType,
      testType = 'SHSAT',
      subject,
      topic,
      difficulty,
      questionsData = []
    } = body;

    console.log('Creating session for user:', user.id);
    console.log('Session params:', { sessionType, testType, subject, topic, difficulty });

    // Get questions if not provided
    let questions = questionsData;
    if (!questions || questions.length === 0) {
      const questionsUrl = new URL(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-questions`);
      questionsUrl.searchParams.set('count', '20');
      questionsUrl.searchParams.set('testType', testType);
      if (subject) questionsUrl.searchParams.set('subject', subject);
      if (topic) questionsUrl.searchParams.set('topic', topic);
      if (difficulty) questionsUrl.searchParams.set('difficulty', difficulty);

      const questionsResponse = await fetch(questionsUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questionsResult = await questionsResponse.json();
      questions = questionsResult.questions;
    }

    if (!questions || questions.length === 0) {
      throw new Error('No questions available for the specified criteria');
    }

    // Create practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        session_type: sessionType,
        test_type: testType,
        subject: subject,
        topic: topic,
        difficulty: difficulty,
        total_questions: questions.length,
        questions_order: questions.map((q: any) => q.id),
        status: 'in_progress'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }

    console.log('Created session:', session.id);

    return new Response(
      JSON.stringify({
        session,
        questions,
        message: 'Practice session created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-session function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
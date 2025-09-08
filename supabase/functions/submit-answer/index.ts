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
    const {
      sessionId,
      questionId,
      userAnswer,
      timeSpent,
      isCorrect,
      isFlagged = false,
      confidenceLevel
    } = body;

    console.log('Submitting answer for session:', sessionId);

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found or access denied');
    }

    // Insert or update user answer with proper conflict resolution
    const { data: answer, error: answerError } = await supabase
      .from('user_answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_spent: timeSpent,
        is_flagged: isFlagged,
        confidence_level: confidenceLevel,
        answered_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,question_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (answerError) {
      console.error('Error submitting answer:', answerError);
      throw answerError;
    }

    // Update session progress - count unique answered questions
    const { data: answersCount } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('session_id', sessionId);

    const uniqueAnsweredQuestions = new Set(answersCount?.map(a => a.question_id) || []).size;

    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        current_question_index: uniqueAnsweredQuestions,
        total_time_spent: Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000)
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session progress:', updateError);
    }

    console.log('Answer submitted successfully');

    return new Response(
      JSON.stringify({
        answer,
        message: 'Answer submitted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in submit-answer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
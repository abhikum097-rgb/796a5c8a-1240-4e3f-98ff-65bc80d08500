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

    const body = await req.json();
    const count = parseInt(body.count || '20');
    const testType = body.testType || 'SHSAT';
    const subject = body.subject;
    const topic = body.topic;
    const difficulty = body.difficulty;

    console.log('Fetching questions with params:', { count, testType, subject, topic, difficulty });

    // Build query
    let query = supabase
      .from('questions')
      .select('*')
      .eq('test_type', testType)
      .eq('is_active', true);

    if (subject) {
      query = query.eq('subject', subject);
    }

    if (topic) {
      query = query.eq('topic', topic);
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    const { data: questions, error } = await query.limit(count);

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    console.log(`Found ${questions?.length || 0} questions`);

    // If we don't have enough questions matching the criteria, get random questions
    if (!questions || questions.length < count) {
      const { data: allQuestions, error: allError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_type', testType)
        .eq('is_active', true)
        .limit(count);

      if (allError) {
        console.error('Error fetching all questions:', allError);
        throw allError;
      }

      return new Response(
        JSON.stringify({ 
          questions: allQuestions || [],
          message: `Found ${allQuestions?.length || 0} questions (expanded search due to limited matches)`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Shuffle questions for randomization
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    return new Response(
      JSON.stringify({ 
        questions: shuffledQuestions,
        message: `Found ${shuffledQuestions.length} questions`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
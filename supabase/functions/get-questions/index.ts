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
    // Create Supabase client with user's auth token
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
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

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const count = parseInt(body.count || '20');
    const testType = body.testType || 'SHSAT';
    const subject = body.subject;
    const topic = body.topic;
    const difficulty = body.difficulty;
    const avoidRecent = body.avoidRecent !== false; // Default true
    const sessionId = body.sessionId;

    console.log('Fetching questions for authenticated user:', user.id);
    console.log('Query params:', { count, testType, subject, topic, difficulty, avoidRecent });

    // Get recently seen questions to avoid repetition
    let recentQuestionIds = [];
    if (avoidRecent) {
      const { data: recentQuestions, error: historyError } = await supabase
        .from('user_question_history')
        .select('question_id')
        .eq('user_id', user.id)
        .gte('last_seen_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('last_seen_at', { ascending: false })
        .limit(100);

      if (!historyError && recentQuestions) {
        recentQuestionIds = recentQuestions.map(r => r.question_id);
        console.log(`Avoiding ${recentQuestionIds.length} recently seen questions`);
      }
    }

    // Build query with filters and avoid recent questions
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

    // Exclude recently seen questions
    if (recentQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${recentQuestionIds.map(id => `'${id}'`).join(',')})`);
    }

    const { data: questions, error } = await query.limit(count * 2); // Get more to ensure variety

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    let selectedQuestions = questions || [];

    // If we don't have enough fresh questions, gradually relax constraints
    if (selectedQuestions.length < count) {
      console.log(`Only ${selectedQuestions.length} fresh questions found, expanding search...`);
      
      // First try without avoiding recent questions
      const { data: allQuestions, error: allError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_type', testType)
        .eq('is_active', true)
        .modify((query) => {
          if (subject) query.eq('subject', subject);
          if (topic) query.eq('topic', topic);
          if (difficulty) query.eq('difficulty_level', difficulty);
        })
        .limit(count * 2);

      if (!allError && allQuestions) {
        selectedQuestions = allQuestions;
      }

      // If still not enough, broaden to just test type and subject
      if (selectedQuestions.length < count && subject) {
        const { data: broadQuestions, error: broadError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_type', testType)
          .eq('subject', subject)
          .eq('is_active', true)
          .limit(count * 2);

        if (!broadError && broadQuestions) {
          selectedQuestions = broadQuestions;
        }
      }

      // Final fallback: any questions from this test type
      if (selectedQuestions.length < count) {
        const { data: fallbackQuestions, error: fallbackError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_type', testType)
          .eq('is_active', true)
          .limit(count * 2);

        if (!fallbackError && fallbackQuestions) {
          selectedQuestions = fallbackQuestions;
        }
      }
    }

    if (!selectedQuestions || selectedQuestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          questions: [],
          message: 'No questions available for the specified criteria'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Shuffle and limit to requested count
    const shuffledQuestions = selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    console.log(`Returning ${shuffledQuestions.length} questions for user ${user.id}`);

    // Track question history if sessionId provided
    if (sessionId && shuffledQuestions.length > 0) {
      const historyInserts = shuffledQuestions.map(q => ({
        user_id: user.id,
        question_id: q.id,
        session_id: sessionId,
        last_seen_at: new Date().toISOString(),
        times_seen: 1
      }));

      await supabase
        .from('user_question_history')
        .upsert(historyInserts, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        });
      
      console.log(`Tracked ${historyInserts.length} questions in user history`);
    }

    return new Response(
      JSON.stringify({ 
        questions: shuffledQuestions,
        message: `Found ${shuffledQuestions.length} questions`,
        freshQuestions: selectedQuestions.length === (questions?.length || 0)
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
})
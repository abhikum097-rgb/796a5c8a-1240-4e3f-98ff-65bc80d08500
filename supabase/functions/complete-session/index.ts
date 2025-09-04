
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
    const { sessionId, totalTimeSpent } = body;

    console.log('Completing session:', sessionId, 'for user:', user.id);

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

    // Get all answers for this session
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    // Calculate score
    const correctAnswers = answers?.filter(a => a.is_correct === true).length || 0;
    const totalAnswered = answers?.length || 0;
    const score = totalAnswered > 0 ? Math.round((correctAnswers / session.total_questions) * 100) : 0;
    const percentageCorrect = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

    console.log(`Session completed: ${correctAnswers}/${session.total_questions} correct (${score}%)`);

    // Update session as completed
    const { data: completedSession, error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        score: score,
        percentage_correct: percentageCorrect,
        total_time_spent: totalTimeSpent || 0
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      throw updateError;
    }

    // Use service role key to update analytics (bypasses RLS)
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Update user analytics
    try {
      const { error: analyticsError } = await serviceSupabase
        .rpc('update_user_analytics', {
          p_user_id: user.id,
          p_session_id: sessionId
        });

      if (analyticsError) {
        console.error('Error updating analytics:', analyticsError);
        // Don't throw error here as session completion is more important
      } else {
        console.log('Analytics updated successfully');
      }
    } catch (analyticsErr) {
      console.error('Analytics update failed:', analyticsErr);
    }

    // Update user profile study time and streak properly
    try {
      const studyTimeMinutes = Math.round((totalTimeSpent || 0) / 60);
      
      // Get current profile values first
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('total_study_time, study_streak')
        .eq('id', user.id)
        .single();

      if (currentProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            total_study_time: (currentProfile.total_study_time || 0) + studyTimeMinutes,
            study_streak: (currentProfile.study_streak || 0) + 1
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        } else {
          console.log('Profile updated successfully');
        }
      }
    } catch (profileErr) {
      console.error('Profile update failed:', profileErr);
    }

    return new Response(
      JSON.stringify({
        session: completedSession,
        results: {
          score,
          correctAnswers,
          totalQuestions: session.total_questions,
          totalAnswered,
          percentageCorrect,
          totalTimeSpent: totalTimeSpent || 0
        },
        message: 'Session completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in complete-session function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

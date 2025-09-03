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

    console.log('Fetching analytics for user:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Get user analytics by subject
    const { data: analytics, error: analyticsError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', user.id)
      .order('subject', { ascending: true })
      .order('topic', { ascending: true });

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      throw analyticsError;
    }

    // Get recent sessions for score history
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    // Transform analytics data for frontend consumption
    const performanceBySubject = analytics?.reduce((acc: any[], item) => {
      let subject = acc.find(s => s.subject === item.subject);
      
      if (!subject) {
        subject = {
          subject: item.subject,
          accuracy: 0,
          questionsAttempted: 0,
          averageTime: 0,
          color: getSubjectColor(item.subject),
          topics: []
        };
        acc.push(subject);
      }

      subject.topics.push({
        topic: item.topic,
        accuracy: item.accuracy_percentage || 0,
        questionsAttempted: item.total_attempted || 0,
        mastery: item.mastery_level || 'Beginner',
        averageTime: item.avg_time_per_question || 0
      });

      return acc;
    }, []) || [];

    // Calculate overall stats for each subject
    performanceBySubject.forEach((subject: any) => {
      const totalAttempted = subject.topics.reduce((sum: number, topic: any) => sum + topic.questionsAttempted, 0);
      const weightedAccuracy = subject.topics.reduce((sum: number, topic: any) => 
        sum + (topic.accuracy * topic.questionsAttempted), 0);
      const weightedTime = subject.topics.reduce((sum: number, topic: any) => 
        sum + (topic.averageTime * topic.questionsAttempted), 0);

      subject.questionsAttempted = totalAttempted;
      subject.accuracy = totalAttempted > 0 ? Math.round(weightedAccuracy / totalAttempted) : 0;
      subject.averageTime = totalAttempted > 0 ? Math.round(weightedTime / totalAttempted) : 0;
    });

    // Transform score history
    const scoreHistory = sessions?.map(session => ({
      date: new Date(session.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      score: session.score || 0,
      testType: session.test_type,
      sessionType: session.session_type
    })) || [];

    // Calculate overall stats
    const totalQuestions = analytics?.reduce((sum, item) => sum + (item.total_attempted || 0), 0) || 0;
    const totalCorrect = analytics?.reduce((sum, item) => sum + (item.total_correct || 0), 0) || 0;
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const overallStats = {
      totalQuestions,
      averageScore,
      studyStreak: profile?.study_streak || 0,
      timeSpentThisWeek: profile?.total_study_time || 0
    };

    console.log('Analytics data prepared successfully');

    return new Response(
      JSON.stringify({
        overallStats,
        performanceBySubject,
        scoreHistory,
        profile,
        message: 'Analytics retrieved successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    'Math': '#1E40AF',
    'Verbal': '#059669', 
    'Reading': '#D97706',
    'Writing': '#7C3AED'
  };
  return colors[subject] || '#6B7280';
}
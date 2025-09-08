import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// SECURITY: In production, restrict CORS to specific domains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict to specific domains in production
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
    const { testType, subject } = body;

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('Fetching topics for:', { testType, subject });
    }

    // Use the database function to get topics
    const { data: topics, error } = await supabase
      .rpc('get_available_topics', {
        p_test_type: testType,
        p_subject: subject || null
      });

    if (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log(`Found ${topics?.length || 0} topics`);
    }

    return new Response(
      JSON.stringify({ 
        topics: topics || [],
        message: `Found ${topics?.length || 0} topics`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-topics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
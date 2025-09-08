
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );

    // Verify user authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (roleError || !hasRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: withinLimit, error: limitError } = await supabase
      .rpc('check_ai_function_limit', { 
        p_function_name: 'process-question',
        p_daily_limit: 100 
      });
    
    if (limitError || !withinLimit) {
      return new Response(
        JSON.stringify({ success: false, error: 'Daily rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, metadata } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured')
      throw new Error('OPENAI_API_KEY not configured')
    }

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('Processing question for user:', user.id);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert test prep question parser. Convert questions into structured JSON format.

REQUIRED JSON STRUCTURE (respond with ONLY this JSON object):
{
  "test_type": "SHSAT|SSAT|ISEE|HSPT|TACHS",
  "subject": "Math|Verbal|Reading|Writing", 
  "topic": "string (e.g., Algebra, Vocabulary, Reading Comprehension)",
  "sub_topic": "string (optional, more specific topic)",
  "difficulty_level": "Easy|Medium|Hard",
  "question_text": "string (the main question)",
  "passage": "string (optional, for reading comprehension - include ONLY if there is a reading passage)",
  "option_a": "string",
  "option_b": "string", 
  "option_c": "string",
  "option_d": "string",
  "correct_answer": "A|B|C|D",
  "explanation": "string (detailed explanation of why the answer is correct)",
  "time_allocated": number (suggested seconds, usually 60-120)
}

Extract all question information and make reasonable inferences for any missing data.` 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('OpenAI API error:', data)
      throw new Error(data.error?.message || 'OpenAI API error')
    }

    const rawContent = data.choices[0].message.content
    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('OpenAI response received, content length:', rawContent?.length || 0);
    }
    
    // Ensure we have valid JSON content
    let cleanedContent = rawContent
    if (rawContent) {
      // Remove any potential markdown code fences as fallback
      cleanedContent = rawContent.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim()
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        content: cleanedContent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Question processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

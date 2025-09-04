
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { prompt, metadata } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured')
      throw new Error('OPENAI_API_KEY not configured')
    }

    console.log('Processing question with OpenAI...')

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
            
CRITICAL: You MUST respond with ONLY valid JSON, no other text or formatting.
CRITICAL: Do not wrap your response in markdown code blocks.
CRITICAL: Respond with ONLY the raw JSON object.

REQUIRED JSON STRUCTURE:
{
  "test_type": "SHSAT|SSAT|ISEE|HSPT|TACHS",
  "subject": "Math|Verbal|Reading|Writing", 
  "topic": "string (e.g., Algebra, Vocabulary, Reading Comprehension)",
  "sub_topic": "string (optional, more specific topic)",
  "difficulty_level": "Easy|Medium|Hard",
  "question_text": "string (the main question)",
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

    console.log('OpenAI response received successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        content: data.choices[0].message.content 
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkQuestion {
  test_type: string;
  subject: string;
  topic: string;
  sub_topic?: string;
  difficulty_level: string;
  question_text: string;
  passage?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  time_allocated?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role (defense in depth)
    const { data: hasRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (roleError || !hasRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required for bulk import' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('Processing bulk import for admin user:', user.id);
    }

    const { questions, overwrite_duplicates } = await req.json();

    // SECURITY: Input validation
    if (!questions || !Array.isArray(questions)) {
      throw new Error('Questions must be an array');
    }
    
    if (questions.length > 1000) {
      throw new Error('Too many questions (max 1,000 per batch)');
    }

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log(`Processing ${questions.length} questions`);
    }

    const results = {
      successful: 0,
      failed: 0,
      duplicates_skipped: 0,
      errors: [] as string[]
    }

    // Process questions in batches of 50 to avoid timeout
    const batchSize = 50
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      
      for (const question of batch) {
        try {
          // Validate required fields
          const requiredFields = ['test_type', 'subject', 'topic', 'difficulty_level', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation']
          const missingFields = requiredFields.filter(field => !question[field])
          
          if (missingFields.length > 0) {
            results.failed++
            results.errors.push(`Question missing fields: ${missingFields.join(', ')}`)
            continue
          }

          // Validate correct_answer
          if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
            results.failed++
            results.errors.push(`Invalid correct_answer: ${question.correct_answer}`)
            continue
          }

          const questionData = {
            test_type: question.test_type,
            subject: question.subject,
            topic: question.topic,
            sub_topic: question.sub_topic || null,
            difficulty_level: question.difficulty_level,
            question_text: question.question_text,
            passage: question.passage || null,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            time_allocated: question.time_allocated || 90,
            is_active: true
          }

          if (overwrite_duplicates) {
            // Use upsert to handle duplicates
            const { error } = await supabaseClient
              .from('questions')
              .upsert(questionData, {
                onConflict: 'test_type,subject,topic,question_text,option_a,option_b,option_c,option_d,correct_answer'
              })

            if (error) {
              throw error
            }
            results.successful++
          } else {
            // Try to insert, handle duplicates gracefully
            const { error } = await supabaseClient
              .from('questions')
              .insert(questionData)

            if (error) {
              if (error.code === '23505') { // Unique constraint violation
                results.duplicates_skipped++
              } else {
                throw error
              }
            } else {
              results.successful++
            }
          }
        } catch (error: any) {
          console.error('Error processing question:', error)
          results.failed++
          results.errors.push(`Question processing error: ${error.message}`)
        }
      }
    }

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('Bulk import completed:', results);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Import completed: ${results.successful} successful, ${results.failed} failed, ${results.duplicates_skipped} duplicates skipped`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        results: { successful: 0, failed: 0, duplicates_skipped: 0, errors: [error.message] }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
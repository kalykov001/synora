import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { document_id, output_language = 'en' } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: doc } = await supabase
      .from('documents')
      .select('extracted_text, title')
      .eq('id', document_id)
      .single()

    if (!doc?.extracted_text) throw new Error('Document text not available')

    const prompt = `You are an expert study assistant. Create a comprehensive study summary of the following text.

Output language: ${output_language} (respond in this language)

Requirements:
- Use markdown formatting (headers, bullet points, bold for key terms)
- Organize by main topics and subtopics
- Highlight key concepts and definitions
- Include important facts and relationships
- Be thorough but concise

Text to summarize:
${doc.extracted_text.slice(0, 30000)}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Save summary
    const { data: summary, error } = await supabase
      .from('summaries')
      .insert({ document_id, content, language: output_language })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

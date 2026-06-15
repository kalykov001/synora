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
    const { session_id, message, output_language = 'en' } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get session + document context
    const { data: session } = await supabase
      .from('tutor_sessions')
      .select('*, documents(title, extracted_text)')
      .eq('id', session_id)
      .single()

    // Get message history (last 20)
    const { data: history } = await supabase
      .from('tutor_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20)

    const docContext = session?.documents?.extracted_text
      ? `\n\nDocument context (${session.documents.title}):\n${session.documents.extracted_text.slice(0, 15000)}`
      : ''

    const systemPrompt = `You are Synora AI Tutor — an expert, friendly study assistant. Help the student understand their material deeply.

Output language: ${output_language} (always respond in this language)
${docContext}

Guidelines:
- Give clear, structured explanations
- Use examples when helpful
- Break down complex concepts step by step
- Encourage the student
- If asked about something not in the document, you can answer from general knowledge`

    // Build conversation history for Gemini
    const contents = [
      ...(history ?? []).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.'

    // Save both messages and bump session updated_at
    await Promise.all([
      supabase.from('tutor_messages').insert([
        { session_id, role: 'user', content: message },
        { session_id, role: 'assistant', content: reply },
      ]),
      supabase.from('tutor_sessions').update({ updated_at: new Date().toISOString() }).eq('id', session_id),
    ])

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

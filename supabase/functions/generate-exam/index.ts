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
    const { document_id, count = 10, output_language = 'en' } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: doc } = await supabase
      .from('documents')
      .select('extracted_text, title')
      .eq('id', document_id)
      .single()

    if (!doc?.extracted_text) throw new Error('Document text not available')

    const prompt = `Create exactly ${count} multiple-choice exam questions from the following text.

Output language: ${output_language} (all text in this language)

Rules:
- Each question has exactly 4 options (A, B, C, D)
- Only ONE option is correct
- Distractors should be plausible but clearly wrong
- Questions test understanding, not just memorization
- Vary difficulty across questions

Return ONLY valid JSON array:
[{"question": "...", "options": ["option A", "option B", "option C", "option D"], "correct_option": 0}, ...]
(correct_option is 0-indexed: 0=A, 1=B, 2=C, 3=D)

Text:
${doc.extracted_text.slice(0, 25000)}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    if (geminiData.error) throw new Error(`Gemini error: ${geminiData.error.message}`)
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!rawText) throw new Error(`Gemini empty response, reason: ${geminiData.candidates?.[0]?.finishReason}`)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`Failed to parse exam JSON. Raw: ${rawText.slice(0, 200)}`)
    const questions: { question: string; options: string[]; correct_option: number }[] = JSON.parse(jsonMatch[0])

    // Create exam
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .insert({ document_id, title: `${doc.title} — Exam` })
      .select()
      .single()

    if (examErr) throw examErr

    // Insert questions
    const { error: qErr } = await supabase.from('exam_questions').insert(
      questions.map((q) => ({ exam_id: exam.id, question: q.question, options: q.options, correct_option: q.correct_option }))
    )

    if (qErr) throw qErr

    return new Response(JSON.stringify({ exam_id: exam.id, count: questions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

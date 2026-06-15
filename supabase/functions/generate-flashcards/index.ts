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
    const { document_id, count = 20, output_language = 'en' } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: doc } = await supabase
      .from('documents')
      .select('extracted_text, title')
      .eq('id', document_id)
      .single()

    if (!doc?.extracted_text) throw new Error('Document text not available')

    const prompt = `Create exactly ${count} flashcards from the following text for studying.

Output language: ${output_language} (both question and answer in this language)

Rules:
- Each card tests ONE specific concept, fact, or definition
- Questions should be clear and specific
- Answers should be concise (1-3 sentences max)
- Assign difficulty 1-5 (1=basic, 3=medium, 5=hard)
- Cover the most important concepts

Return ONLY valid JSON array:
[{"question": "...", "answer": "...", "difficulty": 3}, ...]

Text:
${doc.extracted_text.slice(0, 25000)}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Failed to parse flashcards JSON')
    const cards: { question: string; answer: string; difficulty: number }[] = JSON.parse(jsonMatch[0])

    // Create flashcard set
    const { data: set, error: setErr } = await supabase
      .from('flashcard_sets')
      .insert({ document_id, title: `${doc.title} — Flashcards` })
      .select()
      .single()

    if (setErr) throw setErr

    // Insert all cards
    const { error: cardsErr } = await supabase.from('flashcard_items').insert(
      cards.map((c) => ({ set_id: set.id, question: c.question, answer: c.answer, difficulty: c.difficulty ?? 3 }))
    )

    if (cardsErr) throw cardsErr

    return new Response(JSON.stringify({ set_id: set.id, count: cards.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

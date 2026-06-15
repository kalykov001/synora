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
    const { document_id } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get document record
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docErr || !doc) throw new Error('Document not found')

    // Update status to processing
    await supabase.from('documents').update({ status: 'processing' }).eq('id', document_id)

    // Download PDF from Storage
    const { data: fileData, error: fileErr } = await supabase
      .storage
      .from('pdfs')
      .download(doc.file_path)

    if (fileErr || !fileData) throw new Error('Failed to download PDF')

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Send to Gemini to extract text and detect language
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                text: 'Extract ALL text from this PDF document. Also detect the primary language. Return ONLY valid JSON: {"text": "<full extracted text>", "language": "<ISO 639-1 code like en, ru, de, fr, es, ar, tr, ky, kk>", "page_count": <number>}',
              },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse Gemini response')
    const parsed = JSON.parse(jsonMatch[0])

    // Update document with extracted data
    await supabase.from('documents').update({
      extracted_text: parsed.text,
      language_detected: parsed.language,
      page_count: parsed.page_count ?? null,
      status: 'ready',
    }).eq('id', document_id)

    return new Response(JSON.stringify({ success: true, language: parsed.language }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    // Mark as error in DB if we have document_id
    try {
      const body = await new Response((await new Request('', { body: JSON.stringify({ error: true }) }).body)).json()
    } catch {}
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

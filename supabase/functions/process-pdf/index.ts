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

  let document_id: string | null = null
  try {
    const body = await req.json()
    document_id = body.document_id
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docErr || !doc) throw new Error('Document not found')

    await supabase.from('documents').update({ status: 'processing' }).eq('id', document_id)

    const { data: fileData, error: fileErr } = await supabase
      .storage
      .from('pdfs')
      .download(doc.file_path)

    if (fileErr || !fileData) throw new Error('Failed to download PDF')

    // Convert to base64 (chunked to avoid stack overflow on large files)
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8.length; i += 8192) {
      binary += String.fromCharCode(...uint8.subarray(i, i + 8192))
    }
    const base64 = btoa(binary)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'application/pdf', data: base64 } },
              {
                text: `Extract all text from this PDF. Respond with ONLY this JSON object, no markdown, no explanation:
{"text": "full extracted text here", "language": "en", "page_count": 1}

Use the actual ISO 639-1 language code (en, ru, de, fr, es, ar, tr, ky, kk, etc).`,
              },
            ],
          }],
          generationConfig: { temperature: 0 },
        }),
      }
    )

    const geminiData = await geminiRes.json()

    // Check for Gemini API errors
    if (geminiData.error) {
      throw new Error(`Gemini API error: ${geminiData.error.message}`)
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) {
      const reason = geminiData.candidates?.[0]?.finishReason ?? 'unknown'
      throw new Error(`Gemini returned empty response. Finish reason: ${reason}`)
    }

    // Try to parse JSON, fall back to raw text
    let parsed: { text: string; language: string; page_count: number | null }
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        parsed = { text: rawText, language: 'en', page_count: null }
      }
    } else {
      parsed = { text: rawText, language: 'en', page_count: null }
    }

    await supabase.from('documents').update({
      extracted_text: parsed.text,
      language_detected: parsed.language ?? 'en',
      page_count: parsed.page_count ?? null,
      status: 'ready',
    }).eq('id', document_id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('process-pdf error:', err)
    if (document_id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      await supabase.from('documents').update({ status: 'error' }).eq('id', document_id)
    }
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

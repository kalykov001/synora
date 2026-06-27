import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../stores/settingsStore'
import type { FlashcardSet, FlashcardItem } from '../types/database'

export function useFlashcardSets(documentId: string) {
  return useQuery({
    queryKey: ['flashcard_sets', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FlashcardSet[]
    },
    enabled: !!documentId,
  })
}

export function useFlashcardItems(setId: string) {
  return useQuery({
    queryKey: ['flashcard_items', setId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_items')
        .select('*')
        .eq('set_id', setId)
        .order('difficulty', { ascending: true })
      if (error) throw error
      return data as FlashcardItem[]
    },
    enabled: !!setId,
  })
}

export function useGenerateFlashcards(documentId: string) {
  const outputLanguage = useSettingsStore((s) => s.outputLanguage)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (count: number) => {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { document_id: documentId, count, output_language: outputLanguage },
      })
      if (error) {
        const body = await (error as any).context?.json?.().catch(() => null)
        console.error('generate-flashcards error:', JSON.stringify(body ?? error))
        throw new Error(body?.error ?? error.message)
      }
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcard_sets', documentId] }),
  })
}

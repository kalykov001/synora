import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../stores/settingsStore'
import type { Summary } from '../types/database'

export function useSummary(documentId: string) {
  const outputLanguage = useSettingsStore((s) => s.outputLanguage)

  const query = useQuery({
    queryKey: ['summary', documentId, outputLanguage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('document_id', documentId)
        .eq('language', outputLanguage)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Summary | null
    },
    enabled: !!documentId,
  })

  const qc = useQueryClient()
  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { document_id: documentId, output_language: outputLanguage },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summary', documentId] }),
  })

  return { ...query, generate }
}

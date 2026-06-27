import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Document } from '../types/database'

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Document[]
    },
    refetchInterval: (query) => {
      const docs = query.state.data
      const hasProcessing = docs?.some(
        (d) => d.status === 'uploading' || d.status === 'processing'
      )
      return hasProcessing ? 3000 : false
    },
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Document
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 3s while processing
      const status = query.state.data?.status
      return status === 'uploading' || status === 'processing' ? 3000 : false
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single()
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error
      if (doc?.file_path) {
        await supabase.storage.from('pdfs').remove([doc.file_path])
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

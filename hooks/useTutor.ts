import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TutorSession, TutorMessage } from '../types/database'

export function useTutorSessions() {
  return useQuery({
    queryKey: ['tutor_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as TutorSession[]
    },
  })
}

export function useTutorMessages(sessionId: string) {
  return useQuery({
    queryKey: ['tutor_messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as TutorMessage[]
    },
    enabled: !!sessionId,
  })
}

export function useCreateTutorSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, documentId }: { title: string; documentId?: string }) => {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .insert({ title, document_id: documentId ?? null })
        .select()
        .single()
      if (error) throw error
      return data as TutorSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor_sessions'] }),
  })
}

export function useSendMessage(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase.functions.invoke('tutor-chat', {
        body: { session_id: sessionId, message },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor_messages', sessionId] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../stores/settingsStore'
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('tutor_sessions')
        .insert({ title, document_id: documentId ?? null, user_id: user.id })
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
  const outputLanguage = useSettingsStore((s) => s.outputLanguage)
  return useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase.functions.invoke('tutor-chat', {
        body: { session_id: sessionId, message, output_language: outputLanguage },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor_messages', sessionId] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../stores/settingsStore'
import type { Exam, ExamQuestion } from '../types/database'

export function useExams(documentId: string) {
  return useQuery({
    queryKey: ['exams', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Exam[]
    },
    enabled: !!documentId,
  })
}

export function useExamQuestions(examId: string) {
  return useQuery({
    queryKey: ['exam_questions', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
      if (error) throw error
      return data as ExamQuestion[]
    },
    enabled: !!examId,
  })
}

export function useGenerateExam(documentId: string) {
  const outputLanguage = useSettingsStore((s) => s.outputLanguage)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (count: number) => {
      const { data, error } = await supabase.functions.invoke('generate-exam', {
        body: { document_id: documentId, count, output_language: outputLanguage },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams', documentId] }),
  })
}

export function useSubmitExamAttempt() {
  return useMutation({
    mutationFn: async ({ examId, answers, score }: { examId: string; answers: number[]; score: number }) => {
      const { error } = await supabase.from('exam_attempts').insert({
        exam_id: examId,
        score,
        answers,
      })
      if (error) throw error
    },
  })
}

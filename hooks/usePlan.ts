import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export const FREE_LIMITS = {
  maxDocuments: 3,
  dailySummaries: 2,
  dailyFlashcardSets: 2,
  dailyExams: 2,
  dailyTutorMessages: 10,
}

export function usePlan() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['plan', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user!.id)
        .single()
      return (data?.plan ?? 'free') as 'free' | 'pro'
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

export function useUpgradeToPro() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan'] })
    },
  })
}

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function useLimitCheck() {
  const { data: plan } = usePlan()

  async function checkDocLimit(): Promise<boolean> {
    if (plan === 'pro') return true
    const { count } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
    return (count ?? 0) < FREE_LIMITS.maxDocuments
  }

  async function checkDailySummary(): Promise<boolean> {
    if (plan === 'pro') return true
    const { count } = await supabase
      .from('summaries')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart())
    return (count ?? 0) < FREE_LIMITS.dailySummaries
  }

  async function checkDailyFlashcards(): Promise<boolean> {
    if (plan === 'pro') return true
    const { count } = await supabase
      .from('flashcard_sets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart())
    return (count ?? 0) < FREE_LIMITS.dailyFlashcardSets
  }

  async function checkDailyExam(): Promise<boolean> {
    if (plan === 'pro') return true
    const { count } = await supabase
      .from('exams')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart())
    return (count ?? 0) < FREE_LIMITS.dailyExams
  }

  async function checkDailyTutorMessages(): Promise<boolean> {
    if (plan === 'pro') return true
    const { count } = await supabase
      .from('tutor_messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', todayStart())
    return (count ?? 0) < FREE_LIMITS.dailyTutorMessages
  }

  return {
    isPro: plan === 'pro',
    planLoading: plan === undefined,
    checkDocLimit,
    checkDailySummary,
    checkDailyFlashcards,
    checkDailyExam,
    checkDailyTutorMessages,
  }
}

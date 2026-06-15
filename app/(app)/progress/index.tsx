import { ScrollView, Text, View, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

function useProgressStats() {
  return useQuery({
    queryKey: ['progress_stats'],
    queryFn: async () => {
      const [docs, summaries, flashcardSets, exams, attempts] = await Promise.all([
        supabase.from('documents').select('id, status', { count: 'exact' }),
        supabase.from('summaries').select('id', { count: 'exact' }),
        supabase.from('flashcard_sets').select('id', { count: 'exact' }),
        supabase.from('exams').select('id', { count: 'exact' }),
        supabase.from('exam_attempts').select('score').order('created_at', { ascending: false }).limit(20),
      ])
      const totalDocs = docs.count ?? 0
      const readyDocs = docs.data?.filter((d: { status: string }) => d.status === 'ready').length ?? 0
      const avgScore = attempts.data?.length
        ? Math.round(attempts.data.reduce((s: number, a: { score: number }) => s + a.score, 0) / attempts.data.length)
        : null
      return {
        totalDocs,
        readyDocs,
        summaries: summaries.count ?? 0,
        flashcardSets: flashcardSets.count ?? 0,
        exams: exams.count ?? 0,
        attempts: attempts.data ?? [],
        avgScore,
      }
    },
  })
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 items-center">
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text className="text-white font-bold text-2xl mt-1">{value}</Text>
      <Text className="text-gray-400 text-xs mt-0.5 text-center">{label}</Text>
    </View>
  )
}

export default function ProgressScreen() {
  const { data: stats, isLoading } = useProgressStats()

  return (
    <View className="flex-1 bg-surface">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-white">Прогресс</Text>
        <Text className="text-gray-500 text-sm mt-1">Твоя статистика обучения</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Stats grid */}
          <View className="flex-row gap-3 mb-3">
            <StatCard label="Документов" value={stats?.totalDocs ?? 0} icon="📄" />
            <StatCard label="Конспектов" value={stats?.summaries ?? 0} icon="📝" />
          </View>
          <View className="flex-row gap-3 mb-6">
            <StatCard label="Наборов карточек" value={stats?.flashcardSets ?? 0} icon="🃏" />
            <StatCard label="Экзаменов" value={stats?.exams ?? 0} icon="📋" />
          </View>

          {/* Average score */}
          {stats?.avgScore != null && (
            <View className="bg-primary/20 border border-primary/40 rounded-2xl p-5 mb-6 items-center">
              <Text className="text-gray-300 text-sm mb-1">Средний результат</Text>
              <Text className="text-white font-bold text-5xl">{stats.avgScore}%</Text>
              <Text className="text-gray-400 text-xs mt-1">по последним {stats.attempts.length} попыткам</Text>
            </View>
          )}

          {/* Recent attempts */}
          {stats?.attempts && stats.attempts.length > 0 && (
            <View>
              <Text className="text-white font-semibold text-base mb-3">Последние попытки</Text>
              {stats.attempts.slice(0, 10).map((a: { score: number }, i: number) => (
                <View key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2 flex-row justify-between items-center">
                  <Text className="text-gray-300 text-sm">Попытка #{i + 1}</Text>
                  <View className={[
                    'rounded-lg px-3 py-1',
                    a.score >= 80 ? 'bg-green-500/20' : a.score >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20',
                  ].join(' ')}>
                    <Text className={[
                      'font-bold text-sm',
                      a.score >= 80 ? 'text-green-400' : a.score >= 60 ? 'text-yellow-400' : 'text-red-400',
                    ].join(' ')}>{a.score}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!stats?.totalDocs && (
            <View className="items-center py-12">
              <Text className="text-5xl mb-4">📊</Text>
              <Text className="text-white font-bold text-lg mb-2">Пока пусто</Text>
              <Text className="text-gray-400 text-center">Загрузи документы и начни учиться</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

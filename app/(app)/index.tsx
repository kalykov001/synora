import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const QUICK_ACTIONS = [
  { id: 'upload', icon: '📄', label: 'Upload PDF', color: 'bg-violet-500/20 border-violet-500/30', route: '/(app)/library' },
  { id: 'continue', icon: '▶️', label: 'Continue', color: 'bg-emerald-500/20 border-emerald-500/30', route: '/(app)/library' },
  { id: 'tutor', icon: '🤖', label: 'AI Tutor', color: 'bg-blue-500/20 border-blue-500/30', route: '/(app)/tutor' },
  { id: 'flashcards', icon: '🃏', label: 'Flashcards', color: 'bg-amber-500/20 border-amber-500/30', route: '/(app)/library' },
  { id: 'exam', icon: '📝', label: 'Exam Mode', color: 'bg-rose-500/20 border-rose-500/30', route: '/(app)/library' },
  { id: 'progress', icon: '📊', label: 'Progress', color: 'bg-slate-500/20 border-slate-500/30', route: '/(app)/progress' },
] as const

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Студент'

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-6 pt-16 pb-8">
      <Text className="text-gray-400 text-base mb-1">Привет 👋</Text>
      <Text className="text-3xl font-bold text-white mb-10">{name}</Text>

      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
        Быстрый доступ
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => router.push(action.route as any)}
            className={`w-[47%] p-5 rounded-2xl border ${action.color} items-center gap-2`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ fontSize: 32 }}>{action.icon}</Text>
            <Text className="text-white font-semibold text-sm text-center">{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

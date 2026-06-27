import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'

export default function HomeScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? t('home.student')

  const QUICK_ACTIONS = [
    { id: 'upload', icon: '📄', label: t('home.upload_pdf'), color: 'bg-violet-500/20 border-violet-500/30', route: '/(app)/library' },
    { id: 'continue', icon: '▶️', label: t('home.continue'), color: 'bg-emerald-500/20 border-emerald-500/30', route: '/(app)/library' },
    { id: 'tutor', icon: '🤖', label: t('home.ai_tutor'), color: 'bg-blue-500/20 border-blue-500/30', route: '/(app)/tutor' },
    { id: 'flashcards', icon: '🃏', label: t('home.flashcards'), color: 'bg-amber-500/20 border-amber-500/30', route: '/(app)/library' },
    { id: 'exam', icon: '📝', label: t('home.exam'), color: 'bg-rose-500/20 border-rose-500/30', route: '/(app)/library' },
    { id: 'progress', icon: '📊', label: t('home.progress'), color: 'bg-slate-500/20 border-slate-500/30', route: '/(app)/progress' },
  ] as const

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-6 pt-16 pb-8">
      <Text className="text-gray-400 text-base mb-1">{t('home.greeting')} 👋</Text>
      <Text className="text-3xl font-bold text-white mb-10">{name}</Text>

      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
        {t('home.quick_access')}
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

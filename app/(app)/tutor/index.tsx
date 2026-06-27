import { useState, useRef } from 'react'
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  Text, TextInput, View, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  useTutorSessions, useCreateTutorSession,
  useTutorMessages, useSendMessage,
} from '../../../hooks/useTutor'
import { useLimitCheck, FREE_LIMITS } from '../../../hooks/usePlan'
import type { TutorSession } from '../../../types/database'

export default function TutorScreen() {
  const { t } = useTranslation()
  const [activeSession, setActiveSession] = useState<TutorSession | null>(null)
  const { data: sessions, isLoading } = useTutorSessions()
  const createSession = useCreateTutorSession()

  async function handleNewSession() {
    const session = await createSession.mutateAsync({ title: t('tutor.new_chat') })
    setActiveSession(session)
  }

  if (activeSession) {
    return (
      <ChatView
        session={activeSession}
        onBack={() => setActiveSession(null)}
      />
    )
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">{t('tutor.title')}</Text>
        <Pressable
          onPress={handleNewSession}
          disabled={createSession.isPending}
          className="bg-primary rounded-xl px-4 py-2"
        >
          {createSession.isPending
            ? <ActivityIndicator size="small" color="white" />
            : <Text className="text-white font-semibold">{t('tutor.new')}</Text>
          }
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : !sessions?.length ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🤖</Text>
          <Text className="text-white font-bold text-xl mb-2">{t('tutor.title')}</Text>
          <Text className="text-gray-400 text-center mb-6">{t('tutor.empty_hint')}</Text>
          <Pressable onPress={handleNewSession} className="bg-primary rounded-2xl px-8 py-4">
            <Text className="text-white font-semibold">{t('tutor.new_chat')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerClassName="px-6 pb-8"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveSession(item)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
            >
              <Text className="text-white font-semibold">{item.title}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

function ChatView({ session, onBack }: { session: TutorSession; onBack: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: messages, isLoading } = useTutorMessages(session.id)
  const sendMessage = useSendMessage(session.id)
  const { checkDailyTutorMessages } = useLimitCheck()
  const [input, setInput] = useState('')
  const [pendingMessage, setPendingMessage] = useState('')
  const listRef = useRef<FlatList>(null)

  async function handleSend() {
    const text = input.trim()
    if (!text || sendMessage.isPending) return

    const allowed = await checkDailyTutorMessages()
    if (!allowed) {
      Alert.alert(
        t('plan.limit_hit'),
        t('plan.limit_messages', { count: FREE_LIMITS.dailyTutorMessages }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('plan.go_pro'), onPress: () => router.push('/(app)/upgrade' as any) },
        ]
      )
      return
    }

    setInput('')
    setPendingMessage(text)
    try {
      await sendMessage.mutateAsync(text)
    } finally {
      setPendingMessage('')
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const displayMessages = [
    ...(messages ?? []),
    ...(pendingMessage ? [{ id: '__pending__', role: 'user' as const, content: pendingMessage, session_id: session.id, created_at: '' }] : []),
  ]

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center gap-4 border-b border-white/10">
        <Pressable onPress={onBack}>
          <Text className="text-primary text-base">←</Text>
        </Pressable>
        <Text className="text-white font-semibold flex-1" numberOfLines={1}>{session.title}</Text>
        <Text className="text-2xl">🤖</Text>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={displayMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center">{t('tutor.chat_hint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className={[
                'rounded-2xl px-4 py-3 mb-3 max-w-5/6',
                item.role === 'user'
                  ? 'bg-primary self-end'
                  : 'bg-white/10 self-start',
              ].join(' ')}
            >
              <Text className="text-white text-sm leading-5">{item.content}</Text>
            </View>
          )}
        />
      )}

      {/* AI typing indicator */}
      {sendMessage.isPending && (
        <View className="flex-row items-center gap-2 px-6 py-2 bg-white/5 mx-4 mb-2 rounded-2xl self-start">
          <ActivityIndicator size="small" color="#6366f1" />
          <Text className="text-gray-400 text-xs">{t('tutor.typing')}</Text>
        </View>
      )}

      {/* Input */}
      <View className="flex-row items-end gap-3 px-4 py-3 border-t border-white/10">
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          placeholder={t('tutor.input_placeholder')}
          placeholderTextColor="#64748b"
          multiline
          maxLength={1000}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm"
          style={{ maxHeight: 120 }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="bg-primary rounded-2xl p-3"
          style={{ opacity: input.trim() ? 1 : 0.4 }}
        >
          <Text className="text-white font-bold">→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

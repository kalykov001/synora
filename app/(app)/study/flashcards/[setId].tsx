import { useState } from 'react'
import { Pressable, Text, View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFlashcardItems } from '../../../../hooks/useFlashcards'

export default function FlashcardStudyScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>()
  const router = useRouter()
  const { data: cards, isLoading } = useFlashcardItems(setId)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (isLoading || !cards) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (!cards.length) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-4xl mb-4">🃏</Text>
        <Text className="text-white font-bold text-xl">Нет карточек</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-primary rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Назад</Text>
        </Pressable>
      </View>
    )
  }

  const card = cards[index]
  const isLast = index === cards.length - 1

  function handleNext() {
    setFlipped(false)
    setIndex((i) => Math.min(i + 1, cards!.length - 1))
  }

  function handlePrev() {
    setFlipped(false)
    setIndex((i) => Math.max(i - 1, 0))
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-base">← Назад</Text>
        </Pressable>
        <Text className="text-gray-400 text-sm">{index + 1} / {cards.length}</Text>
      </View>

      {/* Progress bar */}
      <View className="mx-6 h-1 bg-white/10 rounded-full mb-8">
        <View
          className="h-1 bg-primary rounded-full"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </View>

      {/* Card */}
      <Pressable
        onPress={() => setFlipped((f) => !f)}
        className="mx-6 flex-1 max-h-72 rounded-3xl items-center justify-center border"
        style={{
          backgroundColor: flipped ? '#4f46e5' : 'rgba(255,255,255,0.05)',
          borderColor: flipped ? '#6366f1' : 'rgba(255,255,255,0.1)',
        }}
      >
        <Text className="text-xs text-gray-400 mb-3 uppercase tracking-widest">
          {flipped ? 'Ответ' : 'Вопрос'}
        </Text>
        <Text className="text-white text-lg font-semibold text-center px-6">
          {flipped ? card.answer : card.question}
        </Text>
        <Text className="text-gray-500 text-xs mt-6">Нажми чтобы перевернуть</Text>
      </Pressable>

      {/* Navigation */}
      <View className="flex-row gap-4 px-6 py-8">
        <Pressable
          onPress={handlePrev}
          disabled={index === 0}
          className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
          style={{ opacity: index === 0 ? 0.4 : 1 }}
        >
          <Text className="text-white font-semibold">← Назад</Text>
        </Pressable>

        {isLast ? (
          <Pressable
            onPress={() => router.back()}
            className="flex-1 py-4 rounded-2xl bg-primary items-center"
          >
            <Text className="text-white font-semibold">Готово ✓</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            className="flex-1 py-4 rounded-2xl bg-primary items-center"
          >
            <Text className="text-white font-semibold">Далее →</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

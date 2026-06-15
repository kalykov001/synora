import { useState } from 'react'
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useExamQuestions, useSubmitExamAttempt } from '../../../../hooks/useExam'

type Phase = 'quiz' | 'result'

export default function ExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>()
  const router = useRouter()
  const { data: questions, isLoading } = useExamQuestions(examId)
  const submitAttempt = useSubmitExamAttempt()

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [phase, setPhase] = useState<Phase>('quiz')
  const [score, setScore] = useState(0)

  if (isLoading || !questions) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (!questions.length) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-4xl mb-4">📋</Text>
        <Text className="text-white font-bold text-xl">Нет вопросов</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-primary rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Назад</Text>
        </Pressable>
      </View>
    )
  }

  const answered = Object.keys(answers).length
  const allAnswered = answered === questions.length

  async function handleSubmit() {
    const correctCount = questions!.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correct_option ? 1 : 0)
    }, 0)
    const pct = Math.round((correctCount / questions!.length) * 100)
    setScore(pct)
    setPhase('result')
    await submitAttempt.mutateAsync({
      examId,
      answers: Object.values(answers),
      score: pct,
    })
  }

  if (phase === 'result') {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-7xl mb-4">{score >= 80 ? '🏆' : score >= 60 ? '👍' : '📖'}</Text>
        <Text className="text-white font-bold text-4xl">{score}%</Text>
        <Text className="text-gray-400 mt-2 mb-8">
          {score >= 80 ? 'Отлично!' : score >= 60 ? 'Хорошо!' : 'Нужно повторить'}
        </Text>
        <Pressable onPress={() => router.back()} className="bg-primary rounded-2xl px-8 py-4">
          <Text className="text-white font-semibold text-base">Вернуться</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-base">← Назад</Text>
        </Pressable>
        <Text className="text-gray-400 text-sm">{answered}/{questions.length} ответено</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
        {questions.map((q, qi) => (
          <View key={q.id} className="mb-6">
            <Text className="text-white font-semibold text-base mb-3">
              {qi + 1}. {q.question}
            </Text>
            {(q.options as string[]).map((opt, oi) => {
              const selected = answers[qi] === oi
              return (
                <Pressable
                  key={oi}
                  onPress={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  className={[
                    'rounded-xl p-4 mb-2 border',
                    selected
                      ? 'bg-primary/30 border-primary'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  <Text className={selected ? 'text-white font-semibold' : 'text-gray-300'}>
                    {opt}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-surface">
        <Pressable
          onPress={handleSubmit}
          disabled={!allAnswered || submitAttempt.isPending}
          className="bg-primary rounded-2xl py-4 items-center"
          style={{ opacity: allAnswered ? 1 : 0.4 }}
        >
          {submitAttempt.isPending
            ? <ActivityIndicator size="small" color="white" />
            : <Text className="text-white font-bold text-base">Сдать экзамен</Text>
          }
        </Pressable>
      </View>
    </View>
  )
}

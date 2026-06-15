import { useState } from 'react'
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDocument } from '../../../hooks/useDocuments'
import { useSummary } from '../../../hooks/useSummary'
import { useFlashcardSets, useGenerateFlashcards } from '../../../hooks/useFlashcards'
import { useExams, useGenerateExam } from '../../../hooks/useExam'

type Tab = 'summary' | 'flashcards' | 'exam'

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('summary')

  const { data: doc, isLoading } = useDocument(id)
  const { data: summary, generate: genSummary, isPending: summaryLoading } = useSummary(id)
  const { data: flashcardSets } = useFlashcardSets(id)
  const { data: exams } = useExams(id)
  const generateFlashcards = useGenerateFlashcards(id)
  const generateExam = useGenerateExam(id)

  if (isLoading || !doc) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'summary', label: 'Конспект', icon: '📝' },
    { key: 'flashcards', label: 'Карточки', icon: '🃏' },
    { key: 'exam', label: 'Экзамен', icon: '📋' },
  ]

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-16 pb-4">
        <Pressable onPress={() => router.back()} className="mb-3">
          <Text className="text-primary text-base">← Назад</Text>
        </Pressable>
        <Text className="text-xl font-bold text-white" numberOfLines={2}>{doc.title}</Text>
        {doc.language_detected && (
          <Text className="text-gray-500 text-xs mt-1">{doc.language_detected.toUpperCase()} · {doc.page_count ?? '?'} стр.</Text>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 gap-2 mb-4">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={[
              'flex-1 py-2.5 rounded-xl items-center border',
              activeTab === tab.key
                ? 'bg-primary border-primary'
                : 'bg-white/5 border-white/10',
            ].join(' ')}
          >
            <Text className="text-white text-xs font-semibold">{tab.icon} {tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 px-6">
        {activeTab === 'summary' && (
          <SummaryTab
            summary={summary?.content ?? null}
            loading={summaryLoading}
            docReady={doc.status === 'ready'}
            onGenerate={() => genSummary.mutate()}
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab
            sets={flashcardSets ?? []}
            docReady={doc.status === 'ready'}
            generating={generateFlashcards.isPending}
            onGenerate={() => generateFlashcards.mutate(20)}
            onOpenSet={(setId) => router.push(`/(app)/study/flashcards/${setId}` as any)}
          />
        )}
        {activeTab === 'exam' && (
          <ExamTab
            exams={exams ?? []}
            docReady={doc.status === 'ready'}
            generating={generateExam.isPending}
            onGenerate={() => generateExam.mutate(10)}
            onOpenExam={(examId) => router.push(`/(app)/study/exam/${examId}` as any)}
          />
        )}
      </ScrollView>
    </View>
  )
}

function SummaryTab({ summary, loading, docReady, onGenerate }: {
  summary: string | null; loading: boolean; docReady: boolean; onGenerate: () => void
}) {
  if (!docReady) return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="text-gray-400 mt-4">Документ обрабатывается...</Text>
    </View>
  )

  if (loading) return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="text-gray-400 mt-4">AI генерирует конспект...</Text>
    </View>
  )

  if (!summary) return (
    <View className="items-center py-12">
      <Text className="text-5xl mb-4">📝</Text>
      <Text className="text-white font-bold text-lg mb-2">Конспект не создан</Text>
      <Text className="text-gray-400 text-center mb-6">AI сгенерирует структурированный конспект</Text>
      <Pressable onPress={onGenerate} className="bg-primary rounded-xl px-6 py-3">
        <Text className="text-white font-semibold">Создать конспект</Text>
      </Pressable>
    </View>
  )

  return (
    <View className="pb-8">
      <Text className="text-white text-sm leading-6">{summary}</Text>
    </View>
  )
}

function FlashcardsTab({ sets, docReady, generating, onGenerate, onOpenSet }: {
  sets: any[]; docReady: boolean; generating: boolean; onGenerate: () => void; onOpenSet: (id: string) => void
}) {
  if (!docReady) return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="text-gray-400 mt-4">Документ обрабатывается...</Text>
    </View>
  )

  return (
    <View className="pb-8">
      {sets.map((set) => (
        <Pressable
          key={set.id}
          onPress={() => onOpenSet(set.id)}
          className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 mb-3"
        >
          <Text className="text-white font-semibold">{set.title}</Text>
          <Text className="text-gray-400 text-xs mt-1">Нажми чтобы учить</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={onGenerate}
        disabled={generating}
        className="bg-primary rounded-xl px-6 py-3 items-center mt-2"
        style={{ opacity: generating ? 0.6 : 1 }}
      >
        {generating
          ? <ActivityIndicator size="small" color="white" />
          : <Text className="text-white font-semibold">
              {sets.length ? '+ Новый набор' : 'Создать карточки'}
            </Text>
        }
      </Pressable>
    </View>
  )
}

function ExamTab({ exams, docReady, generating, onGenerate, onOpenExam }: {
  exams: any[]; docReady: boolean; generating: boolean; onGenerate: () => void; onOpenExam: (id: string) => void
}) {
  if (!docReady) return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="text-gray-400 mt-4">Документ обрабатывается...</Text>
    </View>
  )

  return (
    <View className="pb-8">
      {exams.map((exam) => (
        <Pressable
          key={exam.id}
          onPress={() => onOpenExam(exam.id)}
          className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-3"
        >
          <Text className="text-white font-semibold">{exam.title}</Text>
          <Text className="text-gray-400 text-xs mt-1">Нажми чтобы начать</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={onGenerate}
        disabled={generating}
        className="bg-primary rounded-xl px-6 py-3 items-center mt-2"
        style={{ opacity: generating ? 0.6 : 1 }}
      >
        {generating
          ? <ActivityIndicator size="small" color="white" />
          : <Text className="text-white font-semibold">
              {exams.length ? '+ Новый экзамен' : 'Создать экзамен'}
            </Text>
        }
      </Pressable>
    </View>
  )
}

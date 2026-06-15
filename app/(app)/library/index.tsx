import { useState } from 'react'
import {
  Alert, FlatList, Pressable, Text, View, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useDocuments, useDeleteDocument } from '../../../hooks/useDocuments'
import type { Document } from '../../../types/database'

const STATUS_COLOR: Record<string, string> = {
  uploading: 'text-amber-400',
  processing: 'text-blue-400',
  ready: 'text-green-400',
  error: 'text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  uploading: 'Загрузка...',
  processing: 'Обработка AI...',
  ready: 'Готово',
  error: 'Ошибка',
}

function DocumentCard({ doc, onPress, onDelete }: { doc: Document; onPress: () => void; onDelete: () => void }) {
  return (
    <Pressable
      onPress={doc.status === 'ready' ? onPress : undefined}
      onLongPress={onDelete}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <View className="flex-row items-start gap-3">
        <Text style={{ fontSize: 28 }}>📄</Text>
        <View className="flex-1">
          <Text className="text-white font-semibold text-base" numberOfLines={2}>
            {doc.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className={`text-xs font-medium ${STATUS_COLOR[doc.status] ?? 'text-gray-400'}`}>
              {STATUS_LABEL[doc.status] ?? doc.status}
            </Text>
            {(doc.status === 'uploading' || doc.status === 'processing') && (
              <ActivityIndicator size="small" color="#6366f1" />
            )}
            {doc.page_count && (
              <Text className="text-gray-500 text-xs">{doc.page_count} стр.</Text>
            )}
          </View>
          {doc.language_detected && (
            <Text className="text-gray-500 text-xs mt-0.5">{doc.language_detected.toUpperCase()}</Text>
          )}
        </View>
        {doc.status === 'ready' && (
          <Text className="text-gray-500 text-lg">›</Text>
        )}
      </View>
    </Pressable>
  )
}

export default function LibraryScreen() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const { data: documents, isLoading } = useDocuments()
  const deleteDoc = useDeleteDocument()
  const [uploading, setUploading] = useState(false)

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return

    const file = result.assets[0]
    setUploading(true)

    try {
      const fileName = `${user!.id}/${Date.now()}_${file.name}`

      // Upload to storage
      const response = await fetch(file.uri)
      const blob = await response.blob()
      const { error: uploadErr } = await supabase.storage
        .from('pdfs')
        .upload(fileName, blob, { contentType: 'application/pdf' })

      if (uploadErr) throw uploadErr

      // Create document record
      const { data: doc, error: insertErr } = await supabase
        .from('documents')
        .insert({
          user_id: user!.id,
          title: file.name.replace(/\.pdf$/i, ''),
          file_path: fileName,
          status: 'uploading',
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // Trigger processing
      await supabase.functions.invoke('process-pdf', {
        body: { document_id: doc.id },
      })
    } catch (err) {
      Alert.alert('Ошибка загрузки', String(err))
    } finally {
      setUploading(false)
    }
  }

  function confirmDelete(doc: Document) {
    Alert.alert('Удалить документ?', doc.title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteDoc.mutate(doc.id) },
    ])
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">Библиотека</Text>
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          className="bg-primary rounded-xl px-4 py-2 flex-row items-center gap-2"
          style={({ pressed }) => ({ opacity: pressed || uploading ? 0.7 : 1 })}
        >
          {uploading
            ? <ActivityIndicator size="small" color="white" />
            : <Text className="text-white font-semibold">+ PDF</Text>
          }
        </Pressable>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : !documents?.length ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">📚</Text>
          <Text className="text-white text-xl font-bold mb-2">Пусто</Text>
          <Text className="text-gray-400 text-center">
            Загрузи PDF чтобы начать учиться
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-8"
          renderItem={({ item }) => (
            <DocumentCard
              doc={item}
              onPress={() => router.push(`/(app)/library/${item.id}` as any)}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </View>
  )
}

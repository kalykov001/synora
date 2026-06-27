import { useState } from 'react'
import {
  Alert, FlatList, Pressable, Text, View, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useDocuments, useDeleteDocument } from '../../../hooks/useDocuments'
import { useLimitCheck, FREE_LIMITS } from '../../../hooks/usePlan'
import type { Document } from '../../../types/database'

function DocumentCard({
  doc,
  onPress,
  onDelete,
  onCancel,
}: {
  doc: Document
  onPress: () => void
  onDelete: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const STATUS_COLOR: Record<string, string> = {
    uploading: 'text-amber-400',
    processing: 'text-blue-400',
    ready: 'text-green-400',
    error: 'text-red-400',
  }
  const STATUS_LABEL: Record<string, string> = {
    uploading: t('library.status_uploading'),
    processing: t('library.status_processing'),
    ready: t('library.status_ready'),
    error: t('library.status_error'),
  }

  const isProcessing = doc.status === 'uploading' || doc.status === 'processing'
  const showCancel = isProcessing || doc.status === 'error'

  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
      <View className="flex-row items-start gap-3">
        <TouchableOpacity
          onPress={doc.status === 'ready' ? onPress : undefined}
          onLongPress={!isProcessing ? onDelete : undefined}
          activeOpacity={doc.status === 'ready' ? 0.7 : 1}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
        >
          <Text style={{ fontSize: 28 }}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-white font-semibold text-base" numberOfLines={2}>
              {doc.title}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className={`text-xs font-medium ${STATUS_COLOR[doc.status] ?? 'text-gray-400'}`}>
                {STATUS_LABEL[doc.status] ?? doc.status}
              </Text>
              {isProcessing && <ActivityIndicator size="small" color="#6366f1" />}
              {doc.page_count ? (
                <Text className="text-gray-500 text-xs">{doc.page_count} {t('library.pages')}</Text>
              ) : null}
            </View>
            {doc.language_detected ? (
              <Text className="text-gray-500 text-xs mt-0.5">{doc.language_detected.toUpperCase()}</Text>
            ) : null}
          </View>
          {!isProcessing && doc.status === 'ready' && (
            <Text className="text-gray-500 text-lg">›</Text>
          )}
        </TouchableOpacity>

        {showCancel && (
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.6}
            style={{ padding: 4 }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '600' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default function LibraryScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const qc = useQueryClient()
  const { data: documents, isLoading } = useDocuments()
  const deleteDoc = useDeleteDocument()
  const { checkDocLimit } = useLimitCheck()
  const [uploading, setUploading] = useState(false)

  async function handleUpload() {
    const allowed = await checkDocLimit()
    if (!allowed) {
      Alert.alert(
        t('plan.limit_hit'),
        t('plan.limit_docs', { count: FREE_LIMITS.maxDocuments }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('plan.go_pro'), onPress: () => router.push('/(app)/upgrade' as any) },
        ]
      )
      return
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return

    const file = result.assets[0]
    setUploading(true)

    try {
      const fileName = `${user!.id}/${Date.now()}_${file.name}`

      const response = await fetch(file.uri)
      const blob = await response.blob()
      const { error: uploadErr } = await supabase.storage
        .from('pdfs')
        .upload(fileName, blob, { contentType: 'application/pdf' })

      if (uploadErr) throw uploadErr

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

      qc.invalidateQueries({ queryKey: ['documents'] })

      supabase.functions.invoke('process-pdf', { body: { document_id: doc.id } })
        .then(async ({ data, error }) => {
          if (error) {
            try {
              const body = await (error as any).context?.json?.()
              console.error('process-pdf error body:', JSON.stringify(body))
            } catch {
              console.error('process-pdf error:', JSON.stringify(error))
            }
          } else {
            console.log('process-pdf ok:', JSON.stringify(data))
          }
        })
    } catch (err) {
      Alert.alert(t('library.upload_error'), String(err))
    } finally {
      setUploading(false)
    }
  }

  function confirmDelete(doc: Document) {
    Alert.alert(t('library.delete_title'), doc.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteDoc.mutate(doc.id) },
    ])
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">{t('library.title')}</Text>
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : !documents?.length ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">📚</Text>
          <Text className="text-white text-xl font-bold mb-2">{t('library.empty_title')}</Text>
          <Text className="text-gray-400 text-center">{t('library.empty_hint2')}</Text>
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
              onCancel={() => deleteDoc.mutate(item.id)}
            />
          )}
        />
      )}
    </View>
  )
}

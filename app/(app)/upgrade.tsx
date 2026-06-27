import { useState } from 'react'
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { usePlan, FREE_LIMITS } from '../../hooks/usePlan'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

export default function UpgradeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useLocalSearchParams<{ success?: string }>()
  const { data: plan, refetch } = usePlan()
  const user = useAuthStore((s) => s.user)
  const isPro = plan === 'pro'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const FEATURES = [
    { icon: '📄', free: `${FREE_LIMITS.maxDocuments} ${t('plan.docs')}`, pro: t('plan.unlimited'), label: t('plan.feature_docs') },
    { icon: '📝', free: `${FREE_LIMITS.dailySummaries}/${t('plan.day')}`, pro: t('plan.unlimited'), label: t('plan.feature_summaries') },
    { icon: '🃏', free: `${FREE_LIMITS.dailyFlashcardSets}/${t('plan.day')}`, pro: t('plan.unlimited'), label: t('plan.feature_flashcards') },
    { icon: '📋', free: `${FREE_LIMITS.dailyExams}/${t('plan.day')}`, pro: t('plan.unlimited'), label: t('plan.feature_exams') },
    { icon: '🤖', free: `${FREE_LIMITS.dailyTutorMessages}/${t('plan.day')}`, pro: t('plan.unlimited'), label: t('plan.feature_ai') },
  ]

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          user_id: user!.id,
          user_email: user!.email,
          success_url: `${origin}/(app)/upgrade?success=true`,
          cancel_url: `${origin}/(app)/upgrade`,
        },
      })
      if (fnErr) throw fnErr
      if (data?.url) {
        await Linking.openURL(data.url)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Returned from Stripe with ?success=true — poll until plan updates
  const isSuccessReturn = params.success === 'true'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f0f1a' }} contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ color: '#6366f1', fontSize: 16 }}>← {t('plan.back')}</Text>
      </TouchableOpacity>

      {/* Success banner */}
      {isSuccessReturn && !isPro && (
        <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)', padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="small" color="#22c55e" />
          <Text style={{ color: '#22c55e', flex: 1, fontSize: 14 }}>{t('plan.processing')}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: '#22c55e', fontWeight: '700' }}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Text style={{ fontSize: 52, marginBottom: 12 }}>⭐</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 8 }}>Synora Pro</Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center' }}>{t('plan.subtitle')}</Text>
      </View>

      {/* Feature table */}
      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: '#64748b', flex: 1, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}></Text>
          <Text style={{ color: '#64748b', width: 72, fontSize: 12, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' }}>{t('plan.free')}</Text>
          <Text style={{ color: '#6366f1', width: 72, fontSize: 12, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' }}>Pro</Text>
        </View>
        {FEATURES.map((f, i) => (
          <View key={i} style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(255,255,255,0.05)',
          }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>{f.icon}</Text>
            <Text style={{ color: '#e2e8f0', flex: 1, fontSize: 14 }}>{f.label}</Text>
            <Text style={{ color: '#94a3b8', width: 72, fontSize: 12, textAlign: 'center' }}>{f.free}</Text>
            <Text style={{ color: '#22c55e', width: 72, fontSize: 13, textAlign: 'center', fontWeight: '700' }}>{f.pro}</Text>
          </View>
        ))}
      </View>

      {/* Price & CTA */}
      {isPro ? (
        <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>{t('plan.already_pro')}</Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 48, fontWeight: '800' }}>$5.99</Text>
            <Text style={{ color: '#94a3b8', fontSize: 15 }}>{t('plan.per_month')}</Text>
          </View>

          {error ? (
            <Text style={{ color: '#f87171', textAlign: 'center', marginBottom: 12, fontSize: 13 }}>{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={loading}
            style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{t('plan.subscribe')}</Text>
            }
          </TouchableOpacity>

          <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 14 }}>
            {t('plan.cancel_anytime')}
          </Text>
        </>
      )}
    </ScrollView>
  )
}

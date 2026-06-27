import { ScrollView, Text, View, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePlan, FREE_LIMITS } from '../../hooks/usePlan'

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kz', label: 'Қазақша', flag: '🇰🇿' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

function LangList({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (code: string) => void
}) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      {LANGUAGES.map((lang, i) => (
        <TouchableOpacity
          key={lang.code}
          onPress={() => onSelect(lang.code)}
          activeOpacity={0.6}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: i < LANGUAGES.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <Text style={{ fontSize: 22, marginRight: 12 }}>{lang.flag}</Text>
          <Text style={{ color: '#fff', flex: 1, fontSize: 15 }}>{lang.label}</Text>
          {selected === lang.code && (
            <Text style={{ color: '#6366f1', fontSize: 18 }}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { language, outputLanguage, setLanguage, setOutputLanguage } = useSettingsStore()
  const { data: plan } = usePlan()
  const isPro = plan === 'pro'

  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? t('home.student')
  const email = user?.email ?? ''

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f0f1a' }} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{t('settings.title')}</Text>
      </View>

      {/* Profile */}
      <View style={{ marginHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 20, marginBottom: 24 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
            {name[0]?.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 17 }}>{name}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{email}</Text>
      </View>

      {/* Plan */}
      <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
          {t('settings.your_plan')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/upgrade' as any)}
          activeOpacity={0.8}
          style={{
            backgroundColor: isPro ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isPro ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28, marginRight: 12 }}>{isPro ? '⭐' : '🔓'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {isPro ? 'Synora Pro' : t('plan.free')}
            </Text>
            {!isPro && (
              <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                {FREE_LIMITS.maxDocuments} {t('plan.docs')} · {FREE_LIMITS.dailyTutorMessages} AI msg/{t('plan.day')}
              </Text>
            )}
          </View>
          {!isPro && (
            <View style={{ backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Pro →</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Interface language */}
      <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
          {t('settings.interface_lang')}
        </Text>
        <LangList selected={language} onSelect={setLanguage} />
      </View>

      {/* Sign out */}
      <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.7}
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#f87171', fontWeight: '600', fontSize: 16 }}>{t('settings.sign_out')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

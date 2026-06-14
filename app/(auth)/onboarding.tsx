import { FlatList, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../../components/ui'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kz', label: 'Қазақша', flag: '🇰🇿' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const

export default function OnboardingScreen() {
  const { language, setLanguage, setOutputLanguage } = useSettingsStore()
  const router = useRouter()

  function handleSelect(code: string) {
    setLanguage(code)
    setOutputLanguage(code)
  }

  return (
    <View className="flex-1 bg-surface px-6 py-16">
      <Text className="text-3xl font-bold text-white mb-1">Выберите язык</Text>
      <Text className="text-gray-400 mb-8">Язык интерфейса и AI-ответов</Text>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        className="flex-1"
        renderItem={({ item }) => {
          const selected = language === item.code
          return (
            <Pressable
              onPress={() => handleSelect(item.code)}
              className={[
                'flex-row items-center gap-4 p-4 rounded-2xl mb-3 border',
                selected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10',
              ].join(' ')}
            >
              <Text className="text-2xl">{item.flag}</Text>
              <Text className="text-white text-base font-medium flex-1">
                {item.label}
              </Text>
              {selected && <Text className="text-primary text-lg">✓</Text>}
            </Pressable>
          )
        }}
      />

      <Button
        label="Продолжить"
        onPress={() => router.replace('/(app)')}
      />
    </View>
  )
}

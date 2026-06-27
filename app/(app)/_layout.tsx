import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useSettingsStore } from '../../stores/settingsStore'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  )
}

const TAB_LABELS: Record<string, { home: string; library: string; progress: string; settings: string }> = {
  ru: { home: 'Главная', library: 'Библиотека', progress: 'Прогресс', settings: 'Настройки' },
  en: { home: 'Home', library: 'Library', progress: 'Progress', settings: 'Settings' },
  ky: { home: 'Башкы', library: 'Китепкана', progress: 'Прогресс', settings: 'Жөндөөлөр' },
  kz: { home: 'Басты', library: 'Кітапхана', progress: 'Прогресс', settings: 'Баптаулар' },
  tr: { home: 'Ana Sayfa', library: 'Kütüphane', progress: 'İlerleme', settings: 'Ayarlar' },
  de: { home: 'Start', library: 'Bibliothek', progress: 'Fortschritt', settings: 'Einstellungen' },
  fr: { home: 'Accueil', library: 'Bibliothèque', progress: 'Progrès', settings: 'Paramètres' },
  es: { home: 'Inicio', library: 'Biblioteca', progress: 'Progreso', settings: 'Ajustes' },
  ar: { home: 'الرئيسية', library: 'المكتبة', progress: 'التقدم', settings: 'الإعدادات' },
}

export default function AppLayout() {
  const language = useSettingsStore((s) => s.language)
  const labels = TAB_LABELS[language] ?? TAB_LABELS.ru

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 72,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: labels.library,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: labels.progress,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: labels.settings,
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      <Tabs.Screen name="study" options={{ href: null }} />
      <Tabs.Screen name="upgrade" options={{ href: null }} />
    </Tabs>
  )
}

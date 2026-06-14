import { Text, View } from 'react-native'

export default function ProgressScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">📊</Text>
      <Text className="text-xl font-bold text-white mb-2">Прогресс</Text>
      <Text className="text-gray-400 text-center">Статистика — Plan 4</Text>
    </View>
  )
}

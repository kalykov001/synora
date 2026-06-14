import { Text, View } from 'react-native'

export default function LibraryScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">📚</Text>
      <Text className="text-xl font-bold text-white mb-2">Библиотека</Text>
      <Text className="text-gray-400 text-center">Загрузка PDF — Plan 2</Text>
    </View>
  )
}

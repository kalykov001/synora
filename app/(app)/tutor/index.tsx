import { Text, View } from 'react-native'

export default function TutorScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">🤖</Text>
      <Text className="text-xl font-bold text-white mb-2">AI Tutor</Text>
      <Text className="text-gray-400 text-center">Чат с AI — Plan 4</Text>
    </View>
  )
}

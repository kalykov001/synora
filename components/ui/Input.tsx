import { Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm text-gray-400 font-medium">{label}</Text>
      )}
      <TextInput
        className={[
          'bg-white/10 border rounded-xl px-4 py-3.5 text-white text-base',
          error ? 'border-red-500' : 'border-white/20',
        ].join(' ')}
        placeholderTextColor="#64748b"
        {...props}
      />
      {error && <Text className="text-sm text-red-400">{error}</Text>}
    </View>
  )
}

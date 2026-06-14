import { ActivityIndicator, Pressable, Text } from 'react-native'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  testID?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      testID={testID}
      onPress={() => { if (!isDisabled) onPress() }}
      accessibilityState={{ disabled: isDisabled }}
      className={[
        'rounded-xl px-6 py-4 items-center justify-center flex-row gap-2',
        variant === 'primary' && 'bg-primary',
        variant === 'secondary' && 'bg-white/10 border border-white/20',
        variant === 'ghost' && 'bg-transparent',
        isDisabled && 'opacity-50',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && (
        <ActivityIndicator testID={`${testID}-spinner`} size="small" color="white" />
      )}
      <Text
        className={[
          'font-semibold text-base',
          variant === 'primary' && 'text-white',
          variant === 'secondary' && 'text-white',
          variant === 'ghost' && 'text-primary',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  )
}

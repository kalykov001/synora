import { ActivityIndicator, View } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  fullScreen?: boolean
}

export function LoadingSpinner({ size = 'large', fullScreen }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size={size} color="#6366f1" />
      </View>
    )
  }
  return <ActivityIndicator size={size} color="#6366f1" />
}

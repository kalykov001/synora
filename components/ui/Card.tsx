import { View } from 'react-native'
import type { ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={['bg-white/5 border border-white/10 rounded-2xl p-4', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </View>
  )
}

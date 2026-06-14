import { useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../components/ui'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (error) Alert.alert('Ошибка входа', error.message)
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="flex-grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-8">
        <View className="gap-1">
          <Text className="text-5xl font-bold text-white">Synora</Text>
          <Text className="text-gray-400 text-base">AI-powered learning</Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button label="Войти" onPress={handleLogin} loading={loading} />
        </View>

        <View className="items-center flex-row justify-center gap-1">
          <Text className="text-gray-400">Нет аккаунта?</Text>
          <Link href="/(auth)/register" className="text-primary font-semibold">
            Зарегистрироваться
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}

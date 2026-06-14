import { useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../components/ui'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) return
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (error) Alert.alert('Ошибка регистрации', error.message)
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="flex-grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-8">
        <View className="gap-1">
          <Text className="text-4xl font-bold text-white">Создать аккаунт</Text>
          <Text className="text-gray-400 text-base">Присоединяйся к Synora</Text>
        </View>

        <View className="gap-4">
          <Input
            label="Имя"
            value={name}
            onChangeText={setName}
            placeholder="Твоё имя"
            autoCapitalize="words"
          />
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
            placeholder="Минимум 6 символов"
            secureTextEntry
          />
          <Button
            label="Зарегистрироваться"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        <View className="items-center flex-row justify-center gap-1">
          <Text className="text-gray-400">Уже есть аккаунт?</Text>
          <Link href="/(auth)/login" className="text-primary font-semibold">
            Войти
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}

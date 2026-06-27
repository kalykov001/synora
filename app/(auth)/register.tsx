import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../components/ui'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister() {
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Заполни все поля')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text style={{ fontSize: 48 }}>📬</Text>
        <Text className="text-white text-2xl font-bold mt-4 mb-2 text-center">
          Проверь почту
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          Мы отправили письмо на {email}.{'\n'}
          Перейди по ссылке в письме чтобы войти.
        </Text>
        <Link href="/(auth)/login" className="text-primary font-semibold text-base">
          Вернуться ко входу
        </Link>
      </View>
    )
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
          {!!error && (
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          )}
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

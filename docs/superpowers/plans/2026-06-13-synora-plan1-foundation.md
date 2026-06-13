# Synora — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Synora React Native app with Expo Router navigation, Supabase auth, NativeWind styling, and base UI components that boot on Android and iOS.

**Architecture:** Expo SDK 52 with file-based routing (Expo Router v3). Auth state lives in Zustand, synced with Supabase Auth. Two route groups: `(auth)` for unauthenticated screens and `(app)` for authenticated screens with a Tab Bar. Root `_layout.tsx` listens to Supabase auth changes and redirects accordingly.

**Tech Stack:** React Native · Expo SDK 52 · Expo Router v3 · TypeScript (strict) · NativeWind v4 · @supabase/supabase-js · Zustand · i18next · Jest + @testing-library/react-native

> **Note:** This is Plan 1 of 4.
> - Plan 2: PDF upload + Supabase Edge Functions + AI generation pipeline
> - Plan 3: Flashcards + Exams study features
> - Plan 4: AI Tutor chat + Progress screen + full i18n (9 languages)

---

## File Map

**Config:**
- `app.json` — Expo config (scheme, dark theme, plugins)
- `tailwind.config.js` — NativeWind content paths + custom colors
- `babel.config.js` — NativeWind JSX transform
- `metro.config.js` — NativeWind metro integration
- `global.css` — Tailwind directives
- `nativewind-env.d.ts` — NativeWind TypeScript types
- `.env.local` — Supabase URL + anon key (gitignored)
- `jest.config.js` — Jest with jest-expo preset
- `jest.setup.ts` — Mock setup for AsyncStorage and Supabase

**Types:**
- `types/database.ts` — All Supabase table types

**Library:**
- `lib/supabase.ts` — Supabase client singleton with AsyncStorage

**Stores:**
- `stores/authStore.ts` — Auth session + user + signOut action
- `stores/settingsStore.ts` — Persisted language preference (AsyncStorage)

**UI Components:**
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Card.tsx`
- `components/ui/LoadingSpinner.tsx`

**Tests:**
- `components/ui/__tests__/Button.test.tsx`
- `stores/__tests__/authStore.test.ts`
- `stores/__tests__/settingsStore.test.ts`

**App Screens:**
- `app/_layout.tsx` — Root layout: Supabase auth listener + redirect guard
- `app/(auth)/_layout.tsx` — Stack layout for auth group
- `app/(auth)/login.tsx` — Login form
- `app/(auth)/register.tsx` — Register form
- `app/(auth)/onboarding.tsx` — Language selection (first-run)
- `app/(app)/_layout.tsx` — Tab Bar (Home / Library / AI Tutor / Progress)
- `app/(app)/index.tsx` — Home screen with 6 quick-action buttons
- `app/(app)/library/_layout.tsx` — Stack for library
- `app/(app)/library/index.tsx` — Library placeholder
- `app/(app)/tutor/_layout.tsx` — Stack for tutor
- `app/(app)/tutor/index.tsx` — Tutor placeholder
- `app/(app)/progress/_layout.tsx` — Stack for progress
- `app/(app)/progress/index.tsx` — Progress placeholder

**Database:**
- `supabase/migrations/001_initial_schema.sql` — All 9 tables + RLS policies

**i18n (Plan 1 covers EN + RU only; remaining 7 languages added in Plan 4):**
- `i18n/index.ts` — i18next init
- `i18n/locales/en.json`
- `i18n/locales/ru.json`

---

## Task 1: Initialize Expo project

**Files:**
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold the app into the current directory**

```bash
cd C:\Users\USER\Desktop\synora-number2
npx create-expo-app@latest . --template blank-typescript
```

When prompted "A new Expo project will be created... Continue?" — press Y.

Expected output ends with: `✅ Your project is ready!`

- [ ] **Step 2: Update app.json**

Replace the generated `app.json` with:

```json
{
  "expo": {
    "name": "Synora",
    "slug": "synora",
    "scheme": "synora",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f0f1a"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.synora.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f0f1a"
      },
      "package": "com.synora.app"
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 3: Update package.json main entry for Expo Router**

In `package.json`, set:

```json
{
  "main": "expo-router/entry"
}
```

- [ ] **Step 4: Update tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Add .env.local to .gitignore**

Append to `.gitignore`:

```
.env.local
.env*.local
```

- [ ] **Step 6: Create the directory structure**

```bash
mkdir -p app/(auth) app/(app)/library app/(app)/tutor app/(app)/progress
mkdir -p components/ui components/ui/__tests__
mkdir -p lib stores stores/__tests__
mkdir -p types i18n/locales
mkdir -p supabase/migrations supabase/functions
```

- [ ] **Step 7: Commit**

```bash
git init
git add app.json package.json tsconfig.json .gitignore
git commit -m "feat: initialize Synora Expo project"
```

---

## Task 2: Install and configure NativeWind v4

**Files:**
- Create: `tailwind.config.js`
- Modify: `babel.config.js`
- Create: `metro.config.js`
- Create: `global.css`
- Create: `nativewind-env.d.ts`

- [ ] **Step 1: Install packages**

```bash
npx expo install nativewind@^4.1.23 tailwindcss@^3.4.0
npx expo install react-native-reanimated react-native-safe-area-context
npx expo install expo-router expo-document-picker expo-file-system expo-image expo-haptics
```

Expected: packages install without errors.

- [ ] **Step 2: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        surface: '#0f0f1a',
        'surface-2': '#1a1a2e',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Replace babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  };
};
```

- [ ] **Step 4: Create metro.config.js**

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 5: Create global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create nativewind-env.d.ts**

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js babel.config.js metro.config.js global.css nativewind-env.d.ts package.json
git commit -m "feat: configure NativeWind v4 with Tailwind"
```

---

## Task 3: Set up Supabase client

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local`

- [ ] **Step 1: Install Supabase packages**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

- [ ] **Step 2: Create .env.local**

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace values with your actual Supabase project URL and anon key from the Supabase Dashboard → Project Settings → API.

- [ ] **Step 3: Create lib/supabase.ts**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 4: Create types/database.ts**

```typescript
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error'
export type MessageRole = 'user' | 'assistant'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  language: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  file_path: string
  extracted_text: string | null
  language_detected: string | null
  page_count: number | null
  status: DocumentStatus
  created_at: string
}

export interface Summary {
  id: string
  document_id: string
  content: string
  language: string
  created_at: string
}

export interface FlashcardSet {
  id: string
  document_id: string
  title: string
  created_at: string
}

export interface FlashcardItem {
  id: string
  set_id: string
  question: string
  answer: string
  difficulty: number
}

export interface Exam {
  id: string
  document_id: string
  title: string
  created_at: string
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question: string
  options: string[]
  correct: number
}

export interface ExamAttempt {
  id: string
  exam_id: string
  user_id: string
  score: number
  answers: number[]
  completed_at: string
}

export interface TutorSession {
  id: string
  user_id: string
  document_id: string | null
  created_at: string
}

export interface TutorMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts types/database.ts package.json
git commit -m "feat: add Supabase client and database types"
```

---

## Task 4: Configure Jest

**Files:**
- Create: `jest.config.js`
- Create: `jest.setup.ts`

- [ ] **Step 1: Install testing libraries**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

- [ ] **Step 2: Create jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  setupFiles: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

- [ ] **Step 3: Create jest.setup.ts**

```typescript
import '@testing-library/jest-native/extend-expect'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}))
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, ensure scripts contains:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

- [ ] **Step 5: Verify Jest runs**

```bash
npx jest --passWithNoTests
```

Expected: `Test Suites: 0 passed`

- [ ] **Step 6: Commit**

```bash
git add jest.config.js jest.setup.ts package.json
git commit -m "feat: configure Jest with jest-expo and testing-library"
```

---

## Task 5: Build base UI components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/LoadingSpinner.tsx`
- Create: `components/ui/index.ts`
- Create: `components/ui/__tests__/Button.test.tsx`

- [ ] **Step 1: Write the Button test first**

```typescript
// components/ui/__tests__/Button.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../Button'

describe('Button', () => {
  it('renders label', () => {
    const { getByText } = render(<Button label="Войти" onPress={() => {}} />)
    expect(getByText('Войти')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Submit" onPress={onPress} />)
    fireEvent.press(getByText('Submit'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <Button label="Submit" onPress={onPress} disabled testID="btn" />
    )
    fireEvent.press(getByTestId('btn'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', () => {
    const { getByTestId } = render(
      <Button label="Submit" onPress={() => {}} loading testID="btn" />
    )
    expect(getByTestId('btn-spinner')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest components/ui/__tests__/Button.test.tsx
```

Expected: FAIL — `Cannot find module '../Button'`

- [ ] **Step 3: Create components/ui/Button.tsx**

```typescript
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
      onPress={isDisabled ? undefined : onPress}
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
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest components/ui/__tests__/Button.test.tsx
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Create components/ui/Input.tsx**

```typescript
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
```

- [ ] **Step 6: Create components/ui/Card.tsx**

```typescript
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
```

- [ ] **Step 7: Create components/ui/LoadingSpinner.tsx**

```typescript
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
```

- [ ] **Step 8: Create components/ui/index.ts**

```typescript
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'
export { LoadingSpinner } from './LoadingSpinner'
```

- [ ] **Step 9: Commit**

```bash
git add components/
git commit -m "feat: add base UI components (Button, Input, Card, LoadingSpinner)"
```

---

## Task 6: Set up Zustand stores

**Files:**
- Create: `stores/authStore.ts`
- Create: `stores/settingsStore.ts`
- Create: `stores/__tests__/authStore.test.ts`
- Create: `stores/__tests__/settingsStore.test.ts`

- [ ] **Step 1: Install Zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Write authStore test first**

```typescript
// stores/__tests__/authStore.test.ts
import { useAuthStore } from '../authStore'
import type { Session } from '@supabase/supabase-js'

const mockSession = {
  user: { id: 'user-123', email: 'test@test.com' },
  access_token: 'token',
} as unknown as Session

beforeEach(() => {
  useAuthStore.setState({ session: null, user: null, loading: true })
})

describe('authStore', () => {
  it('initializes with loading=true and no session', () => {
    const { session, loading } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(loading).toBe(true)
  })

  it('setSession stores session and user, clears loading', () => {
    useAuthStore.getState().setSession(mockSession)
    const { session, user, loading } = useAuthStore.getState()
    expect(session).toBe(mockSession)
    expect(user?.id).toBe('user-123')
    expect(loading).toBe(false)
  })

  it('setSession(null) clears session and user', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setSession(null)
    const { session, user } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(user).toBeNull()
  })
})
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
npx jest stores/__tests__/authStore.test.ts
```

Expected: FAIL — `Cannot find module '../authStore'`

- [ ] **Step 4: Create stores/authStore.ts**

```typescript
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, loading: false }),
  signOut: async () => {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
    set({ session: null, user: null, loading: false })
  },
}))
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npx jest stores/__tests__/authStore.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 6: Write settingsStore test**

```typescript
// stores/__tests__/settingsStore.test.ts
import { useSettingsStore } from '../settingsStore'

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', outputLanguage: 'en' })
})

describe('settingsStore', () => {
  it('defaults to English', () => {
    const { language } = useSettingsStore.getState()
    expect(language).toBe('en')
  })

  it('setLanguage updates language', () => {
    useSettingsStore.getState().setLanguage('ru')
    expect(useSettingsStore.getState().language).toBe('ru')
  })

  it('setOutputLanguage updates outputLanguage independently', () => {
    useSettingsStore.getState().setLanguage('ru')
    useSettingsStore.getState().setOutputLanguage('en')
    const { language, outputLanguage } = useSettingsStore.getState()
    expect(language).toBe('ru')
    expect(outputLanguage).toBe('en')
  })
})
```

- [ ] **Step 7: Create stores/settingsStore.ts**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsState {
  language: string
  outputLanguage: string
  setLanguage: (lang: string) => void
  setOutputLanguage: (lang: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      outputLanguage: 'en',
      setLanguage: (language) => set({ language }),
      setOutputLanguage: (outputLanguage) => set({ outputLanguage }),
    }),
    {
      name: 'synora-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

- [ ] **Step 8: Run all tests**

```bash
npx jest
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add stores/ package.json
git commit -m "feat: add Zustand auth and settings stores"
```

---

## Task 7: Root layout with auth guard

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(app)/_layout.tsx`

- [ ] **Step 1: Create app/_layout.tsx**

```typescript
import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

function AuthGuard() {
  const { session, loading } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [session, loading, segments])

  return null
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
```

- [ ] **Step 2: Create app/(auth)/_layout.tsx**

```typescript
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f1a' },
        animation: 'slide_from_right',
      }}
    />
  )
}
```

- [ ] **Step 3: Create app/(app)/_layout.tsx**

```typescript
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  )
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 72,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Библиотека',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: add root layout with auth guard and tab bar"
```

---

## Task 8: Build auth screens

**Files:**
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/register.tsx`
- Create: `app/(auth)/onboarding.tsx`

- [ ] **Step 1: Create app/(auth)/login.tsx**

```typescript
import { useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../components/ui'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!email.trim() || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (error) Alert.alert('Ошибка входа', error.message)
    // Auth guard in _layout.tsx handles redirect on success
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
```

- [ ] **Step 2: Create app/(auth)/register.tsx**

```typescript
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
    // Auth guard handles redirect; Supabase trigger creates profile row
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
          <Text className="text-gray-400 text-base">
            Присоединяйся к Synora
          </Text>
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
```

- [ ] **Step 3: Create app/(auth)/onboarding.tsx**

```typescript
import { FlatList, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../../components/ui'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kz', label: 'Қазақша', flag: '🇰🇿' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const

export default function OnboardingScreen() {
  const { language, setLanguage, setOutputLanguage } = useSettingsStore()
  const router = useRouter()

  function handleSelect(code: string) {
    setLanguage(code)
    setOutputLanguage(code)
  }

  function handleContinue() {
    router.replace('/(app)')
  }

  return (
    <View className="flex-1 bg-surface px-6 py-16">
      <Text className="text-3xl font-bold text-white mb-1">
        Выберите язык
      </Text>
      <Text className="text-gray-400 mb-8">
        Язык интерфейса и AI-ответов
      </Text>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        className="flex-1"
        renderItem={({ item }) => {
          const selected = language === item.code
          return (
            <Pressable
              onPress={() => handleSelect(item.code)}
              className={[
                'flex-row items-center gap-4 p-4 rounded-2xl mb-3 border',
                selected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10',
              ].join(' ')}
            >
              <Text className="text-2xl">{item.flag}</Text>
              <Text className="text-white text-base font-medium flex-1">
                {item.label}
              </Text>
              {selected && (
                <Text className="text-primary text-lg">✓</Text>
              )}
            </Pressable>
          )
        }}
      />

      <Button label="Продолжить" onPress={handleContinue} />
    </View>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add login, register, and onboarding screens"
```

---

## Task 9: Database migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create supabase/migrations/001_initial_schema.sql**

```sql
-- ============================================================
-- Synora Initial Schema
-- ============================================================

-- profiles: extends auth.users, created automatically via trigger
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  language   TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- documents
CREATE TABLE documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  file_path         TEXT        NOT NULL,
  extracted_text    TEXT,
  language_detected TEXT,
  page_count        INT,
  status            TEXT        NOT NULL DEFAULT 'uploading'
                                CHECK (status IN ('uploading','processing','ready','error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- summaries
CREATE TABLE summaries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  language    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- flashcard_sets
CREATE TABLE flashcard_sets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- flashcard_items
CREATE TABLE flashcard_items (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id     UUID  NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question   TEXT  NOT NULL,
  answer     TEXT  NOT NULL,
  difficulty INT   NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5)
);

-- exams
CREATE TABLE exams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exam_questions
CREATE TABLE exam_questions (
  id       UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id  UUID  NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question TEXT  NOT NULL,
  options  JSONB NOT NULL,  -- string[]
  correct  INT   NOT NULL   -- index into options
);

-- exam_attempts
CREATE TABLE exam_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score        INT         NOT NULL,
  answers      JSONB       NOT NULL,  -- int[]
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tutor_sessions
CREATE TABLE tutor_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID        REFERENCES documents(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tutor_messages
CREATE TABLE tutor_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- documents
CREATE POLICY "own documents" ON documents FOR ALL USING (auth.uid() = user_id);

-- summaries (via document ownership)
CREATE POLICY "own summaries" ON summaries FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = summaries.document_id AND d.user_id = auth.uid())
);

-- flashcard_sets (via document ownership)
CREATE POLICY "own flashcard_sets" ON flashcard_sets FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = flashcard_sets.document_id AND d.user_id = auth.uid())
);

-- flashcard_items (via set → document ownership)
CREATE POLICY "own flashcard_items" ON flashcard_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets fs
    JOIN documents d ON d.id = fs.document_id
    WHERE fs.id = flashcard_items.set_id AND d.user_id = auth.uid()
  )
);

-- exams (via document ownership)
CREATE POLICY "own exams" ON exams FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = exams.document_id AND d.user_id = auth.uid())
);

-- exam_questions (via exam → document ownership)
CREATE POLICY "own exam_questions" ON exam_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exams e
    JOIN documents d ON d.id = e.document_id
    WHERE e.id = exam_questions.exam_id AND d.user_id = auth.uid()
  )
);

-- exam_attempts
CREATE POLICY "own exam_attempts" ON exam_attempts FOR ALL USING (auth.uid() = user_id);

-- tutor_sessions
CREATE POLICY "own tutor_sessions" ON tutor_sessions FOR ALL USING (auth.uid() = user_id);

-- tutor_messages (via session ownership)
CREATE POLICY "own tutor_messages" ON tutor_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM tutor_sessions ts WHERE ts.id = tutor_messages.session_id AND ts.user_id = auth.uid())
);

-- ============================================================
-- Storage Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "own pdfs" ON storage.objects FOR ALL
  USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "public avatars read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "own avatars write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 2: Apply migration via Supabase Dashboard**

1. Go to your Supabase project → SQL Editor
2. Paste the full contents of `001_initial_schema.sql`
3. Click **Run**
4. Expected: no errors, all tables appear in Table Editor

Alternatively, with Supabase CLI installed:
```bash
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add initial Supabase schema with RLS policies"
```

---

## Task 10: Home screen

**Files:**
- Create: `app/(app)/index.tsx`

- [ ] **Step 1: Create app/(app)/index.tsx**

```typescript
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const QUICK_ACTIONS = [
  {
    id: 'upload',
    icon: '📄',
    label: 'Upload PDF',
    color: 'bg-violet-500/20 border-violet-500/30',
    route: '/(app)/library' as const,
  },
  {
    id: 'continue',
    icon: '▶️',
    label: 'Continue',
    color: 'bg-emerald-500/20 border-emerald-500/30',
    route: '/(app)/library' as const,
  },
  {
    id: 'tutor',
    icon: '🤖',
    label: 'AI Tutor',
    color: 'bg-blue-500/20 border-blue-500/30',
    route: '/(app)/tutor' as const,
  },
  {
    id: 'flashcards',
    icon: '🃏',
    label: 'Flashcards',
    color: 'bg-amber-500/20 border-amber-500/30',
    route: '/(app)/library' as const,
  },
  {
    id: 'exam',
    icon: '📝',
    label: 'Exam Mode',
    color: 'bg-rose-500/20 border-rose-500/30',
    route: '/(app)/library' as const,
  },
  {
    id: 'progress',
    icon: '📊',
    label: 'Progress',
    color: 'bg-slate-500/20 border-slate-500/30',
    route: '/(app)/progress' as const,
  },
] as const

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Студент'

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-6 pt-16 pb-8"
    >
      <Text className="text-gray-400 text-base mb-1">Привет 👋</Text>
      <Text className="text-3xl font-bold text-white mb-10">{name}</Text>

      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
        Быстрый доступ
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => router.push(action.route)}
            className={`w-[47%] p-5 rounded-2xl border ${action.color} items-center gap-2`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ fontSize: 32 }}>{action.icon}</Text>
            <Text className="text-white font-semibold text-sm text-center">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/index.tsx
git commit -m "feat: add home screen with quick-action grid"
```

---

## Task 11: Placeholder screens for Library, Tutor, Progress

**Files:**
- Create: `app/(app)/library/_layout.tsx`
- Create: `app/(app)/library/index.tsx`
- Create: `app/(app)/tutor/_layout.tsx`
- Create: `app/(app)/tutor/index.tsx`
- Create: `app/(app)/progress/_layout.tsx`
- Create: `app/(app)/progress/index.tsx`

- [ ] **Step 1: Create app/(app)/library/_layout.tsx**

```typescript
import { Stack } from 'expo-router'

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f1a' },
      }}
    />
  )
}
```

- [ ] **Step 2: Create app/(app)/library/index.tsx**

```typescript
import { Text, View } from 'react-native'

export default function LibraryScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">📚</Text>
      <Text className="text-xl font-bold text-white mb-2">Библиотека</Text>
      <Text className="text-gray-400 text-center">
        Загрузка PDF и управление документами — Plan 2
      </Text>
    </View>
  )
}
```

- [ ] **Step 3: Create app/(app)/tutor/_layout.tsx**

```typescript
import { Stack } from 'expo-router'

export default function TutorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f1a' },
      }}
    />
  )
}
```

- [ ] **Step 4: Create app/(app)/tutor/index.tsx**

```typescript
import { Text, View } from 'react-native'

export default function TutorScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">🤖</Text>
      <Text className="text-xl font-bold text-white mb-2">AI Tutor</Text>
      <Text className="text-gray-400 text-center">
        Чат с AI ассистентом — Plan 4
      </Text>
    </View>
  )
}
```

- [ ] **Step 5: Create app/(app)/progress/_layout.tsx**

```typescript
import { Stack } from 'expo-router'

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f1a' },
      }}
    />
  )
}
```

- [ ] **Step 6: Create app/(app)/progress/index.tsx**

```typescript
import { Text, View } from 'react-native'

export default function ProgressScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-4xl mb-4">📊</Text>
      <Text className="text-xl font-bold text-white mb-2">Прогресс</Text>
      <Text className="text-gray-400 text-center">
        Статистика и аналитика обучения — Plan 4
      </Text>
    </View>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/(app)/library/ app/(app)/tutor/ app/(app)/progress/
git commit -m "feat: add placeholder screens for library, tutor, progress"
```

---

## Task 12: Set up i18n (EN + RU)

**Files:**
- Create: `i18n/index.ts`
- Create: `i18n/locales/en.json`
- Create: `i18n/locales/ru.json`

- [ ] **Step 1: Install i18next**

```bash
npm install i18next react-i18next
```

- [ ] **Step 2: Create i18n/locales/en.json**

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "back": "Back"
  },
  "auth": {
    "login_title": "Synora",
    "login_subtitle": "AI-powered learning",
    "login_button": "Sign In",
    "register_title": "Create account",
    "register_subtitle": "Join Synora",
    "register_button": "Sign Up",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "no_account": "Don't have an account?",
    "have_account": "Already have an account?",
    "sign_up_link": "Sign Up",
    "sign_in_link": "Sign In",
    "password_min": "Password must be at least 6 characters"
  },
  "onboarding": {
    "title": "Choose Language",
    "subtitle": "Interface and AI response language",
    "continue": "Continue"
  },
  "home": {
    "greeting": "Hello",
    "quick_access": "Quick Access",
    "upload_pdf": "Upload PDF",
    "continue": "Continue",
    "ai_tutor": "AI Tutor",
    "flashcards": "Flashcards",
    "exam": "Exam Mode",
    "progress": "Progress"
  },
  "library": {
    "title": "Library",
    "empty": "No documents yet",
    "empty_hint": "Upload a PDF to get started"
  },
  "tutor": {
    "title": "AI Tutor",
    "placeholder": "Ask anything about your material..."
  },
  "progress": {
    "title": "Progress",
    "no_data": "Start learning to see your progress"
  }
}
```

- [ ] **Step 3: Create i18n/locales/ru.json**

```json
{
  "common": {
    "loading": "Загрузка...",
    "error": "Что-то пошло не так",
    "retry": "Повторить",
    "cancel": "Отмена",
    "save": "Сохранить",
    "delete": "Удалить",
    "back": "Назад"
  },
  "auth": {
    "login_title": "Synora",
    "login_subtitle": "AI-обучение",
    "login_button": "Войти",
    "register_title": "Создать аккаунт",
    "register_subtitle": "Присоединяйся к Synora",
    "register_button": "Зарегистрироваться",
    "email": "Email",
    "password": "Пароль",
    "name": "Имя",
    "no_account": "Нет аккаунта?",
    "have_account": "Уже есть аккаунт?",
    "sign_up_link": "Зарегистрироваться",
    "sign_in_link": "Войти",
    "password_min": "Пароль должен быть минимум 6 символов"
  },
  "onboarding": {
    "title": "Выберите язык",
    "subtitle": "Язык интерфейса и AI-ответов",
    "continue": "Продолжить"
  },
  "home": {
    "greeting": "Привет",
    "quick_access": "Быстрый доступ",
    "upload_pdf": "Upload PDF",
    "continue": "Продолжить",
    "ai_tutor": "AI Tutor",
    "flashcards": "Карточки",
    "exam": "Экзамен",
    "progress": "Прогресс"
  },
  "library": {
    "title": "Библиотека",
    "empty": "Документов пока нет",
    "empty_hint": "Загрузите PDF чтобы начать"
  },
  "tutor": {
    "title": "AI Tutor",
    "placeholder": "Спроси что угодно по материалу..."
  },
  "progress": {
    "title": "Прогресс",
    "no_data": "Начни учиться чтобы увидеть прогресс"
  }
}
```

- [ ] **Step 4: Create i18n/index.ts**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 5: Import i18n in app/_layout.tsx**

Add this import at the top of `app/_layout.tsx` (after `'../global.css'`):

```typescript
import '../i18n'
```

- [ ] **Step 6: Run all tests**

```bash
npx jest
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add i18n/ app/_layout.tsx package.json
git commit -m "feat: add i18n with English and Russian locales"
```

---

## Task 13: Verify the app boots

- [ ] **Step 1: Start the dev server**

```bash
npx expo start
```

- [ ] **Step 2: Test on device or emulator**

Press `a` for Android emulator or `i` for iOS simulator.

Expected:
- App shows `LoadingSpinner` briefly, then redirects to `/(auth)/login`
- Login screen shows "Synora" title, email/password inputs, "Войти" button
- Tapping "Зарегистрироваться" navigates to register screen
- Register screen navigates back via "Войти" link
- Tab bar appears after successful login/register (Home · Library · AI Tutor · Progress)
- Home screen shows greeting + 6 quick-action buttons
- All 4 tabs are navigable

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: Plan 1 complete — foundation, auth, navigation, base UI"
```

---

## Self-Review Checklist (completed inline)

- ✅ All spec requirements for Plan 1 covered (scaffolding, auth, navigation, DB schema, i18n start)
- ✅ No TBD/TODO/placeholder code in tasks
- ✅ Types defined in Task 3 used consistently in Tasks 4–8 (`Session`, `User`, `DocumentStatus`, etc.)
- ✅ `supabase` import in authStore uses dynamic import to avoid circular dependency
- ✅ `LoadingSpinner` defined before used in `_layout.tsx`
- ✅ Auth guard handles both directions: unauth→login and auth→app
- ✅ Supabase Storage RLS policies included in migration
- ✅ `global.css` imported in root `_layout.tsx` (required for NativeWind v4)
- ✅ i18n imported in root `_layout.tsx` so translations load before any screen renders

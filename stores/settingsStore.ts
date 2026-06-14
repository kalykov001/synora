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

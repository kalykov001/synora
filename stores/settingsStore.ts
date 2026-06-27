import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsState {
  language: string
  outputLanguage: string
  setLanguage: (lang: string) => void
  setOutputLanguage: (lang: string) => void
}

function applyLanguage(lang: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const i18n = require('../i18n').default
    if (i18n?.changeLanguage) i18n.changeLanguage(lang)
  } catch {
    // silently ignore in test environments
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ru',
      outputLanguage: 'ru',
      setLanguage: (language) => {
        set({ language })
        applyLanguage(language)
      },
      setOutputLanguage: (outputLanguage) => set({ outputLanguage }),
    }),
    {
      name: 'synora-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) applyLanguage(state.language)
      },
    }
  )
)

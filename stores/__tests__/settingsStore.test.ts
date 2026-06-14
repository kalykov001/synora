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

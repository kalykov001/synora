import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'
import ky from './locales/ky.json'
import kz from './locales/kz.json'
import tr from './locales/tr.json'
import ar from './locales/ar.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    ky: { translation: ky },
    kz: { translation: kz },
    tr: { translation: tr },
    ar: { translation: ar },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n

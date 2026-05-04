'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import fr from '../public/locales/fr.json'
import ar from '../public/locales/ar.json'

type Language = 'fr' | 'ar'
type Direction = 'ltr' | 'rtl'

const translations: Record<Language, any> = { fr, ar }

interface LanguageContextType {
  language: Language
  direction: Direction
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  direction: 'ltr',
  setLanguage: () => { },
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const saved = localStorage.getItem('dourous-lang') as Language
    if (saved === 'fr' || saved === 'ar') {
      setLanguageState(saved)
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = saved
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('dourous-lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const t = (key: string): string => {
    const activeTranslations = translations[language]
    const value = activeTranslations[key]
    
    if (!value) {
      console.warn(`Missing translation key: "${key}"`)
      // Fallback to FR if missing in AR
      if (language === 'ar' && translations['fr'][key]) {
        return translations['fr'][key]
      }
      return key
    }
    return value
  }

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

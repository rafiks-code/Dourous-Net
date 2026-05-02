'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'

type LanguageContextType = {
  language: 'fr' | 'ar'
  setLanguage: (lang: 'fr' | 'ar') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'fr' | 'ar'>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('dourous-lang') as 'fr' | 'ar'
    if (savedLang) {
      setLanguageState(savedLang)
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = savedLang
      if (savedLang === 'ar') {
        document.body.style.fontFamily = 'var(--font-cairo), sans-serif'
      } else {
        document.body.style.fontFamily = 'var(--font-inter), sans-serif'
      }
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: 'fr' | 'ar') => {
    setLanguageState(lang)
    localStorage.setItem('dourous-lang', lang)
    
    // Apply RTL and Font
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    if (lang === 'ar') {
      document.body.style.fontFamily = 'var(--font-cairo), sans-serif'
    } else {
      document.body.style.fontFamily = 'var(--font-inter), sans-serif'
    }
  }

  const t = (key: string) => {
    return translations[language]?.[key] || translations['fr']?.[key] || key
  }

  if (!mounted) {
    return <div className="invisible">{children}</div>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: 'fr',
      setLanguage: () => {},
      t: (key: string) => key,
    }
  }
  return context
}

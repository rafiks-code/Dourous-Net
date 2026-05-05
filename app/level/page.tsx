'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LEVELS, STORAGE_KEYS, type Level } from '@/lib/constants'
import { setToStorage } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

const LEVEL_INFO: Record<Level, { description: string; descriptionAr: string; color: string }> = {
  '1AS': {
    description: 'Première Année Secondaire',
    descriptionAr: 'السنة الأولى ثانوي',
    color: 'from-sky-600/30 to-blue-600/20',
  },
  '2AS': {
    description: 'Deuxième Année Secondaire',
    descriptionAr: 'السنة الثانية ثانوي',
    color: 'from-indigo-600/30 to-violet-600/20',
  },
  '3AS': {
    description: 'Troisième Année Secondaire (BAC)',
    descriptionAr: 'السنة الثالثة ثانوي (بكالوريا)',
    color: 'from-violet-600/30 to-purple-600/20',
  },
}

export default function LevelPage() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const isAr = language === 'ar'
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setIsLoggedIn(true)
      } catch (e) {}
    }
    checkAuth()
  }, [])

  const handleLevel = (level: Level) => {
    setToStorage(STORAGE_KEYS.LEVEL, level)
    router.push('/filiere')
  }

  return (
    <div
      className="page-container flex flex-col items-center justify-center"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              < GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-3">
            <span className="gradient-text">{t('chooseLevel')}</span>
          </h1>
          <p className="text-white/50 text-lg">
            {t('selectLevelDesc')}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {LEVELS.map((level, i) => {
            const info = LEVEL_INFO[level]
            return (
              <button
                key={level}
                id={`level-${level.toLowerCase()}`}
                onClick={() => handleLevel(level)}
                className={cn(
                  "group relative flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-gradient-to-r backdrop-blur-sm transition-all duration-300 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:scale-99 animate-fade-in-up",
                  info.color
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={cn("flex items-center gap-5", isAr ? "flex-row-reverse" : "flex-row")}>
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black text-white border border-white/20 group-hover:bg-white/20 transition-colors">
                    {level.replace('AS', '')}
                    <span className="text-xs font-normal ml-0.5">AS</span>
                  </div>
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <p className="text-xl font-bold text-white">{level}</p>
                    <p className="text-white/60 text-sm">{isAr ? info.descriptionAr : info.description}</p>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all",
                    isAr ? 'rotate-180 group-hover:-translate-x-1' : ''
                  )}
                />
              </button>
            )
          })}
        </div>

        {!isLoggedIn && (
          <>
            <div className="flex justify-center mt-10 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    step === 1 ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20'
                  )}
                />
              ))}
            </div>
            <p className="text-center text-white/30 text-xs mt-2">{t('step')} 1 {t('of')} 4</p>
          </>
        )}
      </div>
    </div>
  )
}

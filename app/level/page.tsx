'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LEVELS, STORAGE_KEYS, type Level } from '@/lib/constants'
import { getFromStorage, setToStorage } from '@/lib/utils'
import { ChevronRight, GraduationCap } from 'lucide-react'

const LEVEL_INFO: Record<Level, { description: string; descriptionAr: string; color: string; year: string }> = {
  '1AS': {
    description: 'Première Année Secondaire',
    descriptionAr: 'السنة الأولى ثانوي',
    color: 'from-sky-600/30 to-blue-600/20',
    year: '1ère',
  },
  '2AS': {
    description: 'Deuxième Année Secondaire',
    descriptionAr: 'السنة الثانية ثانوي',
    color: 'from-indigo-600/30 to-violet-600/20',
    year: '2ème',
  },
  '3AS': {
    description: 'Troisième Année Secondaire (BAC)',
    descriptionAr: 'السنة الثالثة ثانوي (بكالوريا)',
    color: 'from-violet-600/30 to-purple-600/20',
    year: '3ème',
  },
}

export default function LevelPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'fr' | 'ar'>('fr')
  const isAr = lang === 'ar'

  useEffect(() => {
    const stored = getFromStorage(STORAGE_KEYS.LANGUAGE)
    if (stored === 'ar') setLang('ar')
  }, [])

  const handleLevel = (level: Level) => {
    setToStorage(STORAGE_KEYS.LEVEL, level)
    router.push('/filiere')
  }

  return (
    <div
      className={`page-container flex flex-col items-center justify-center ${isAr ? 'rtl' : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-3">
            {isAr ? (
              <span className="gradient-text">اختر مستواك الدراسي</span>
            ) : (
              <span className="gradient-text">Choisissez votre niveau</span>
            )}
          </h1>
          <p className="text-white/50 text-lg">
            {isAr ? 'حدد صفك لعرض المواد المناسبة' : 'Sélectionnez votre classe pour accéder à vos cours'}
          </p>
        </div>

        {/* Level cards */}
        <div className="flex flex-col gap-4">
          {LEVELS.map((level, i) => {
            const info = LEVEL_INFO[level]
            return (
              <button
                key={level}
                id={`level-${level.toLowerCase()}`}
                onClick={() => handleLevel(level)}
                className={`group relative flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-gradient-to-r ${info.color} backdrop-blur-sm transition-all duration-300 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:scale-99 animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`flex items-center gap-5 ${isAr ? 'flex-row-reverse' : ''}`}>
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
                  className={`w-5 h-5 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all ${isAr ? 'rotate-180' : ''}`}
                />
              </button>
            )
          })}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center mt-10 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20'}`}
            />
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-2">{isAr ? 'الخطوة ١ من ٤' : 'Étape 1 sur 4'}</p>
      </div>
    </div>
  )
}

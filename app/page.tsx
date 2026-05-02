'use client'

import { useRouter } from 'next/navigation'
import { STORAGE_KEYS, MODULES_BY_LEVEL_FILIERE, FILIERES_BY_LEVEL } from '@/lib/constants'
import { setToStorage } from '@/lib/utils'
import { BookOpen, Globe } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const handleLanguage = (lang: 'fr' | 'ar') => {
    setToStorage(STORAGE_KEYS.LANGUAGE, lang)
    router.push('/level')
  }

  const allModules = new Set<string>()
  Object.values(MODULES_BY_LEVEL_FILIERE).forEach(filieres => {
    Object.values(filieres).forEach(modules => {
      modules.forEach(m => allModules.add(m))
    })
  })
  const totalModules = allModules.size

  const allFilieres = new Set<string>()
  Object.values(FILIERES_BY_LEVEL).forEach(filieres => {
    filieres.forEach(f => allFilieres.add(f))
  })
  const totalFilieres = allFilieres.size

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-float">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black mb-4 animate-fade-in-up">
          <span className="gradient-text">Dourous‑Net</span>
        </h1>
        <p className="text-white/60 text-lg md:text-xl mb-12 animate-fade-in-up stagger-1">
          Extranet éducatif pour lycéens · منصة تعليمية للثانويين
        </p>

        {/* Language buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up stagger-2">
          {/* French */}
          <button
            id="lang-fr"
            onClick={() => handleLanguage('fr')}
            className="group relative w-64 h-36 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 backdrop-blur-sm transition-all duration-300 hover:border-indigo-400/60 hover:from-indigo-600/30 hover:to-violet-600/20 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 active:scale-95"
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span className="text-4xl">🇫🇷</span>
              <div>
                <p className="text-2xl font-bold text-white">Français</p>
                <p className="text-sm text-white/50">Continuer en français</p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/10 transition-all duration-300" />
          </button>

          {/* Arabic */}
          <button
            id="lang-ar"
            onClick={() => handleLanguage('ar')}
            className="group relative w-64 h-36 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-purple-600/10 backdrop-blur-sm transition-all duration-300 hover:border-violet-400/60 hover:from-violet-600/30 hover:to-purple-600/20 hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-2 active:scale-95"
            dir="rtl"
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span className="text-4xl">🇩🇿</span>
              <div>
                <p className="text-2xl font-bold text-white">العربية</p>
                <p className="text-sm text-white/50">المتابعة بالعربية</p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:to-purple-500/10 transition-all duration-300" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-16 pb-8 animate-fade-in-up stagger-3">
          {[
            { label: 'Modules', value: totalModules },
            { label: 'Niveaux', value: 3 },
            { label: 'Filières', value: totalFilieres },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

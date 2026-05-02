'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MODULES_BY_LEVEL_FILIERE, MODULE_ICONS, MODULE_ARABIC, FILIERE_ARABIC, STORAGE_KEYS, type Level, type Filiere } from '@/lib/constants'
import { getFromStorage } from '@/lib/utils'
import { ArrowLeft, Search, BookOpen, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ModulesPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'fr' | 'ar'>('fr')
  const [level, setLevel] = useState<Level | null>(null)
  const [filiere, setFiliere] = useState<Filiere | null>(null)
  const [search, setSearch] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const isAr = lang === 'ar'

  useEffect(() => {
    const storedLang = getFromStorage(STORAGE_KEYS.LANGUAGE) as 'fr' | 'ar'
    const storedLevel = getFromStorage(STORAGE_KEYS.LEVEL) as Level
    const storedFiliere = getFromStorage(STORAGE_KEYS.FILIERE) as Filiere

    if (storedLang) setLang(storedLang)
    // Check auth first to avoid infinite redirect loop
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      
      if (user) {
        // If logged in, get level/filiere from their profile
        const userLevel = user.user_metadata?.level as Level
        const userFiliere = user.user_metadata?.filiere as Filiere
        
        if (userLevel) setLevel(userLevel)
        if (userFiliere) setFiliere(userFiliere)
        
      } else {
        // If not logged in, rely on local storage or redirect
        if (!storedLevel) { router.push('/level'); return }
        if (!storedFiliere) { router.push('/filiere'); return }
        
        setLevel(storedLevel)
        setFiliere(storedFiliere)
      }
    })
  }, [router])

  const modules =
    level && filiere && MODULES_BY_LEVEL_FILIERE[level]?.[filiere]
      ? MODULES_BY_LEVEL_FILIERE[level][filiere]
      : []

  const filtered = modules.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase())
  )

  const handleModuleClick = (moduleName: string) => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/module/${encodeURIComponent(moduleName)}`)
      return
    }
    router.push(`/module/${encodeURIComponent(moduleName)}`)
  }

  return (
    <div
      className={`page-container ${isAr ? 'rtl' : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">


        {/* Back to filiere */}
        <Link href="/filiere" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          {isAr ? 'تغيير الشعبة' : 'Changer de filière'}
        </Link>

        {/* Header */}
        <div className={`flex items-start justify-between mb-8 flex-wrap gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                {level}
              </span>
              <span className="text-white/30">·</span>
              <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
                {isAr && filiere ? FILIERE_ARABIC[filiere] || filiere : filiere}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black">
              <span className="gradient-text">{isAr ? 'اختر المادة' : 'Vos Modules'}</span>
            </h1>
            <p className="text-white/50 mt-1">
              {filtered.length} {isAr ? 'مادة متاحة' : 'modules disponibles'}
            </p>
          </div>
          <BookOpen className="w-10 h-10 text-indigo-400/50" />
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 ${isAr ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث عن مادة...' : 'Rechercher un module...'}
            className={`w-full h-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all ${isAr ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`}
          />
        </div>

        {/* Auth notice */}
        {!isLoggedIn && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>
              {isAr
                ? 'يجب تسجيل الدخول للوصول إلى محتوى المادة'
                : 'Connectez-vous pour accéder au contenu des modules'}
            </span>
            <Link href="/auth/login" className="ml-auto font-semibold underline hover:text-amber-200 transition-colors flex-shrink-0">
              {isAr ? 'دخول' : 'Se connecter'}
            </Link>
          </div>
        )}

        {/* Modules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((moduleName, i) => {
            const icon = MODULE_ICONS[moduleName] ?? '📘'
            return (
              <button
                key={moduleName}
                id={`module-${moduleName.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleModuleClick(moduleName)}
                className="group relative choice-card text-left animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center text-2xl flex-shrink-0 border border-white/10 group-hover:from-indigo-500/40 group-hover:to-violet-500/30 transition-all">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight">
                      {isAr ? MODULE_ARABIC[moduleName] || moduleName : moduleName}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {isLoggedIn ? (isAr ? 'انقر للوصول' : 'Cliquer pour accéder') : (isAr ? 'يتطلب تسجيل دخول' : 'Connexion requise')}
                    </p>
                  </div>
                  {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all pointer-events-none" />
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد نتائج' : 'Aucun module trouvé'}</p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex justify-center mt-12 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`h-1.5 rounded-full transition-all ${step <= 3 ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20'}`} />
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-2">{isAr ? 'الخطوة ٣ من ٤' : 'Étape 3 sur 4'}</p>
      </div>
    </div>
  )
}

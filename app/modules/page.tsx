'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MODULES_BY_LEVEL_FILIERE, MODULE_ICONS, MODULE_ARABIC, FILIERE_ARABIC, STORAGE_KEYS, type Level, type Filiere } from '@/lib/constants'
import { getFromStorage } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { Search, BookOpen, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function ModulesPage() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const [level, setLevel] = useState<Level | null>(null)
  const [filiere, setFiliere] = useState<Filiere | null>(null)
  const [search, setSearch] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const isAr = language === 'ar'

  useEffect(() => {
    const storedLevel = getFromStorage(STORAGE_KEYS.LEVEL) as Level
    const storedFiliere = getFromStorage(STORAGE_KEYS.FILIERE) as Filiere

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setIsLoggedIn(!!user)

      if (user) {
        let userLevel = user.user_metadata?.level as Level
        let userFiliere = user.user_metadata?.filiere as Filiere

        // Fallback: Fetch from students table if metadata is missing
        if (!userLevel || !userFiliere) {
          const { data: student } = await supabase
            .from('students')
            .select('level, filiere')
            .eq('id', user.id)
            .single()

          if (student) {
            userLevel = student.level as Level
            userFiliere = student.filiere as Filiere
          }
        }

        if (userLevel) setLevel(userLevel)
        if (userFiliere) setFiliere(userFiliere)

      } else {
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
      className="page-container"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className={cn("flex items-start justify-between mb-8 flex-wrap gap-4", isAr ? "flex-row-reverse" : "flex-row")}>
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
              <span className="gradient-text">{t('myModules')}</span>
            </h1>
            <p className="text-white/50 mt-1">
              {t('chooseModuleDesc')}
            </p>
          </div>
          <BookOpen className="w-10 h-10 text-indigo-400/50" />
        </div>

        <div className="relative mb-8">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30", isAr ? "right-4" : "left-4")} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={cn("w-full h-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all", isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4")}
          />
        </div>

        {!isLoggedIn && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>
              {t('loginRequiredDesc')}
            </span>
            <Link href="/auth/login" className="ml-auto font-semibold underline hover:text-amber-200 transition-colors flex-shrink-0">
              {t('login')}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((moduleName, i) => {
            const icon = MODULE_ICONS[moduleName] ?? '📘'
            return (
              <button
                key={moduleName}
                id={`module-${moduleName.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleModuleClick(moduleName)}
                className="group relative choice-card text-left animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 1 }}
              >
                <div className={cn("flex items-start gap-4", isAr ? "flex-row-reverse text-right" : "flex-row text-left")}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center text-2xl flex-shrink-0 border border-white/10 group-hover:from-indigo-500/40 group-hover:to-violet-500/30 transition-all">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight">
                      {isAr ? (MODULE_ARABIC[moduleName] || moduleName) : moduleName}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1.5">
                      {isLoggedIn ? t('clickToAccess') : t('loginRequiredShort')}
                    </p>
                  </div>
                  {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />}
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>
              {t('noData')}
            </p>
          </div>
        )}

        {!isLoggedIn && (
          <>
            <div className="flex justify-center mt-12 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={cn("h-1.5 rounded-full transition-all", step <= 3 ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20')} />
              ))}
            </div>
            <p className="text-center text-white/30 text-xs mt-2">{t('step')} 3 {t('of')} 4</p>
          </>
        )}
      </div>
    </div>
  )
}

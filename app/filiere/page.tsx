'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FILIERES_BY_LEVEL, STORAGE_KEYS, type Filiere, type Level, FILIERE_ARABIC } from '@/lib/constants'
import { getFromStorage, setToStorage } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { ChevronRight, FlaskConical, BookText, TrendingUp, Calculator, Wrench, Globe2, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const FILIERE_META: Record<Filiere, {
  icon: React.ReactNode
  description: string
  descriptionAr: string
  color: string
  subjects: string[]
}> = {
  'Scientifique': {
    icon: <FlaskConical className="w-7 h-7" />,
    description: 'Sciences, Maths, Physique',
    descriptionAr: 'علوم، رياضيات، فيزياء',
    color: 'from-emerald-600/30 to-teal-600/20 border-emerald-500/20 hover:border-emerald-400/40',
    subjects: ['📐 Maths', '⚛️ Physique', '🌿 Sciences'],
  },
  'Lettres': {
    icon: <BookText className="w-7 h-7" />,
    description: 'Arabe, Français, Anglais',
    descriptionAr: 'عربية، فرنسية، إنجليزية',
    color: 'from-amber-600/30 to-orange-600/20 border-amber-500/20 hover:border-amber-400/40',
    subjects: ['📜 Arabe', '📖 Français', '🇬🇧 Anglais'],
  },
  'Sciences Expérimentales': {
    icon: <FlaskConical className="w-7 h-7" />,
    description: 'SVT, Physique, Maths',
    descriptionAr: 'علوم طبيعية، فيزياء، رياضيات',
    color: 'from-emerald-600/30 to-teal-600/20 border-emerald-500/20 hover:border-emerald-400/40',
    subjects: ['🌿 SVT', '⚛️ Physique', '📐 Maths'],
  },
  'Mathématiques': {
    icon: <Calculator className="w-7 h-7" />,
    description: 'Maths, Physique, Informatique',
    descriptionAr: 'رياضيات، فيزياء، إعلام آلي',
    color: 'from-blue-600/30 to-indigo-600/20 border-blue-500/20 hover:border-blue-400/40',
    subjects: ['📐 Maths', '⚛️ Physique', '💻 Informatique'],
  },
  'Lettres et Philosophie': {
    icon: <BookText className="w-7 h-7" />,
    description: 'Philosophie, Arabe, Langues',
    descriptionAr: 'فلسفة، لغة عربية، لغات',
    color: 'from-amber-600/30 to-orange-600/20 border-amber-500/20 hover:border-amber-400/40',
    subjects: ['💭 Philosophie', '📜 Arabe', '🗺️ Histoire-Géo'],
  },
  'Langues Étrangères': {
    icon: <Globe2 className="w-7 h-7" />,
    description: 'Français, Anglais, Espagnol',
    descriptionAr: 'فرنسية، إنجليزية، إسبانية',
    color: 'from-pink-600/30 to-rose-600/20 border-pink-500/20 hover:border-pink-400/40',
    subjects: ['📖 Français', '🇬🇧 Anglais', '🇪🇸 Espagnol'],
  },
  'Technique Mathématique': {
    icon: <Wrench className="w-7 h-7" />,
    description: 'Technologie, Maths, Physique',
    descriptionAr: 'تكنولوجيا، رياضيات، فيزياء',
    color: 'from-gray-600/30 to-slate-600/20 border-gray-500/20 hover:border-gray-400/40',
    subjects: ['⚙️ Technologie', '📐 Maths', '📏 Dessin Tech'],
  },
  'Gestion et Économie': {
    icon: <TrendingUp className="w-7 h-7" />,
    description: 'Gestion, Droit, Maths',
    descriptionAr: 'تسيير، قانون، رياضيات',
    color: 'from-violet-600/30 to-purple-600/20 border-violet-500/20 hover:border-violet-400/40',
    subjects: ['📊 Économie', '🧾 Comptabilité', '⚖️ Droit'],
  },
}

export default function FilierePage() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const [level, setLevel] = useState<string>('')
  const isAr = language === 'ar'

  useEffect(() => {
    const storedLevel = getFromStorage(STORAGE_KEYS.LEVEL)
    if (storedLevel) setLevel(storedLevel)
    else router.push('/level')
  }, [router])

  const handleFiliere = (filiere: Filiere) => {
    setToStorage(STORAGE_KEYS.FILIERE, filiere)
    router.push('/modules')
  }

  return (
    <div
      className="page-container flex flex-col items-center justify-center"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <Link href="/level" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('back')}
        </Link>

        <div className="text-center mb-10">
          <div className="inline-block mb-3 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
            {level}
          </div>
          <h1 className="text-4xl font-black mb-3">
            <span className="gradient-text">
              {t('chooseFiliere')}
            </span>
          </h1>
          <p className="text-white/50">
            {t('selectFiliereDesc')}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {level && FILIERES_BY_LEVEL[level as Level]?.map((filiereName, i) => {
            const filiere = filiereName as Filiere
            const meta = FILIERE_META[filiere]
            return (
              <button
                key={filiere}
                id={`filiere-${filiere.toLowerCase().replace(/[\s&]/g, '-')}`}
                onClick={() => handleFiliere(filiere)}
                className={cn(
                  "group relative flex items-center justify-between p-6 rounded-2xl border bg-gradient-to-r backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-99 animate-fade-in-up",
                  meta.color
                )}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className={cn("flex items-center gap-5", isAr ? "flex-row-reverse" : "flex-row")}>
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20 transition-colors flex-shrink-0">
                    {meta.icon}
                  </div>
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <p className="text-lg font-bold text-white">
                      {isAr ? (FILIERE_ARABIC[filiere] || filiere) : filiere}
                    </p>
                    <p className="text-white/50 text-sm mb-2">
                      {isAr ? meta.descriptionAr : meta.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.subjects.map((s) => (
                        <span key={s} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all flex-shrink-0",
                  isAr ? "rotate-180 group-hover:-translate-x-1" : ""
                )} />
              </button>
            )
          })}
        </div>

        <div className="flex justify-center mt-10 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={cn("h-1.5 rounded-full transition-all", step <= 2 ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20')} />
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-2">{t('step')} 2 {t('of')} 4</p>
      </div>
    </div>
  )
}

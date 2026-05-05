'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { BookOpen, Calendar, FileText, Download, Search, ExternalLink, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Lesson {
  id: string
  title: string
  subject: string | null
  file_url: string | null
  content: string | null
  created_at: string
  prof_id: string
}

export default function LessonsPage() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchLessons() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching lessons:', error)
      } else {
        setLessons(data ?? [])
      }
      setLoading(false)
    }
    fetchLessons()
  }, [])

  const filtered = lessons.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.subject ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `${title}.pdf`
      link.click()
    } catch (error) {
      console.error('Download failed:', error)
      window.open(url, '_blank')
    }
  }

  return (
    <div className="page-container max-w-6xl mx-auto py-10 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-12">
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-slide-up">
          <div className="space-y-2">
            <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-indigo-400" />
              {t('lessons')}
            </h1>
            <p className="text-white/50">{t('lessonsSubtitle')}</p>
          </div>

          <div className="relative group max-w-md w-full">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 transition-colors group-focus-within:text-indigo-400",
              isAr ? "right-4" : "left-4"
            )} />
            <input
              type="text"
              placeholder={t('searchLesson')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                "w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-lg backdrop-blur-md",
                isAr ? "pr-12 pl-6 text-right" : "pl-12 pr-6"
              )}
            />
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card h-[280px] skeleton rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-slide-up">
            <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 animate-float">
              <BookOpen className="w-12 h-12 text-indigo-500/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('noLessons')}</h2>
            <p className="text-white/40 max-w-xs text-center">{t('noLessonsDesc')}</p>
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((lesson, index) => (
              <div
                key={lesson.id}
                className="glass-card flex flex-col group hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 animate-fade-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card Top Decoration */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-30 group-hover:opacity-100 transition-opacity" />

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    {lesson.subject && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                        {lesson.subject}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(lesson.created_at).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-3 group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
                    {lesson.title}
                  </h3>

                  {lesson.content && (
                    <p className="text-sm text-white/50 line-clamp-3 mb-6 leading-relaxed">
                      {lesson.content}
                    </p>
                  )}

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs text-white/40">{t('professor')}</span>
                      <span className="text-xs font-bold text-white/70 truncate">Admin</span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="gradient"
                        className="flex-1 rounded-xl h-11"
                        onClick={() => lesson.file_url && window.open(lesson.file_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('openDocument')}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl h-11 border-white/10 hover:bg-white/5"
                        onClick={() => lesson.file_url && handleDownload(lesson.file_url, lesson.title)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

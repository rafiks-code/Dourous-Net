'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Calendar, FileText, Search, GraduationCap, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function LessonsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*, professors(full_name)')
        .order('created_at', { ascending: false })
      
      if (error) console.error('Error fetching lessons:', error)
      
      setLessons(lessonsData || [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.subject || l.professors?.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
  }

  return (
    <div className="page-container max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            {t('lessonsTitle')}
          </h1>
          <p className="text-white/50 mt-2">
            {t('lessonsSubtitle')}
          </p>
        </div>

        {/* Filters/Search */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/40`} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
          </div>
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <div className="glass-card p-16 text-center animate-scale-in">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('noLessons')}</h3>
            <p className="text-white/50 max-w-sm mx-auto">
              {t('noLessonsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLessons.map((lesson: any) => (
              <div key={lesson.id} className="glass-card p-6 flex flex-col group hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="info" className="gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {lesson.subject ?? lesson.professors?.subject ?? t('subject')}
                  </Badge>
                  <div className="text-xs text-white/40 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(lesson.created_at)}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {lesson.title}
                </h3>
                
                <p className="text-sm text-white/50 mb-6 flex-1 line-clamp-2">
                  {t('professor')} {lesson.professors?.full_name}
                </p>

                <div className="flex flex-col gap-2 pt-4 border-t border-white/10 mt-auto">
                  {(lesson.file_url || lesson.content) && (
                    <a href={lesson.file_url || lesson.content} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors w-full">
                      <FileText className="w-4 h-4" />
                      {language === 'ar' ? 'فتح الدرس' : 'Ouvrir le cours'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

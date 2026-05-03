'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, TrendingUp, BookOpen, Calendar, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/language-context'

export default function GradesPage() {
  const { t, language } = useLanguage()
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) console.error('Error:', error)
      else setGrades(data ?? [])
      setLoading(false)
    }
    
    fetchGrades()
  }, [])

  const average = grades.length > 0 
    ? (grades.reduce((acc, curr) => acc + (parseFloat(curr.grade) || 0), 0) / grades.length).toFixed(2)
    : '0.00'

  return (
    <div className="page-container max-w-5xl mx-auto py-10 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            {t('gradesTitle')}
          </h1>
          <div className="glass-card px-6 py-3 flex items-center gap-4 border-amber-500/20">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{t('generalAverage')}</p>
              <p className="text-xl font-black text-white">{average}/20</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-white/50">{t('loading')}</div>
        ) : grades.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-white/40 text-lg font-medium">{t('noGrades')}</p>
            <p className="text-white/20 text-sm mt-2">{t('noGradesDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-5 sm:col-span-4">{t('tableSubject')}</div>
                <div className="col-span-3 sm:col-span-2 text-center">{t('tableGrade')}</div>
                <div className="hidden sm:block col-span-4">{t('tableAppreciation')}</div>
                <div className="col-span-4 sm:col-span-2 text-right">{t('tableDate')}</div>
              </div>
              <div className="divide-y divide-white/5">
                {grades.map((grade) => (
                  <div key={grade.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">{grade.subject}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-center">
                      <span className={cn(
                        "text-lg font-black",
                        grade.grade >= 10 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {grade.grade}/20
                      </span>
                    </div>
                    <div className="hidden sm:block col-span-4">
                      <p className="text-xs text-white/50 line-clamp-1 italic">
                        {grade.appreciation || t('noAppreciation')}
                      </p>
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/30">
                        <Calendar className="w-3 h-3" />
                        {formatDate(grade.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

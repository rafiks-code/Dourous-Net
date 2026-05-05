'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { ClipboardList, Calendar, FileText, Upload, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Homework {
  id: string
  title: string
  description: string | null
  subject: string | null
  due_date: string | null
  file_url: string | null
  created_at: string
}

interface Submission {
  id: string
  homework_id: string
  status: string
  created_at: string
}

interface Correction {
  id: string
  homework_id: string
  pdf_url: string
  grade: number
  comment: string
}

export default function HomeworkPage() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const [homework, setHomework] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [corrections, setCorrections] = useState<Record<string, Correction>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch Homework
    const { data: hwData } = await supabase
      .from('homework')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Fetch Student Submissions
    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id)

    // 3. Fetch Student Corrections
    const { data: corrData } = await supabase
      .from('corrections')
      .select('*')
      .eq('student_id', user.id)

    setHomework(hwData ?? [])

    const subMap: Record<string, Submission> = {}
    subData?.forEach(s => subMap[s.homework_id] = s)
    setSubmissions(subMap)

    const corrMap: Record<string, Correction> = {}
    corrData?.forEach(c => corrMap[c.homework_id] = c)
    setCorrections(corrMap)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatus = (hw: Homework) => {
    const submission = submissions[hw.id]
    if (submission) return { label: t('done'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 }

    if (hw.due_date) {
      const today = new Date()
      const due = new Date(hw.due_date)
      if (due < today) return { label: t('overdue'), color: 'bg-red-500/20 text-red-400 border-red-500/20', icon: AlertCircle }
    }

    return { label: t('todo'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: Clock }
  }

  return (
    <div className="page-container max-w-6xl mx-auto py-10 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-12">
        <header className="space-y-2 animate-fade-slide-up">
          <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
            <ClipboardList className="w-10 h-10 text-blue-400" />
            {t('homework')}
          </h1>
          <p className="text-white/50">{t('homeworkSubtitle')}</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-64 skeleton rounded-2xl" />
            ))}
          </div>
        ) : homework.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-slide-up">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 animate-float">
              <ClipboardList className="w-12 h-12 text-blue-500/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('noHomework')}</h2>
            <p className="text-white/40">{t('noHomeworkDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {homework.map((hw, index) => {
              const status = getStatus(hw)
              const correction = corrections[hw.id]
              const StatusIcon = status.icon

              return (
                <div
                  key={hw.id}
                  className="glass-card flex flex-col group hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-500 animate-fade-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                          {hw.subject}
                        </span>
                        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", status.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/30 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {hw.due_date ? new Date(hw.due_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR') : '---'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white mb-3 group-hover:text-blue-300 transition-colors">
                        {hw.title}
                      </h3>
                      <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                        {hw.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                      {hw.file_url && (
                        <Button
                          variant="secondary"
                          className="rounded-xl h-11 w-full gap-2 hover:bg-white/10"
                          onClick={() => window.open(hw.file_url!, '_blank')}
                        >
                          <FileText className="w-4 h-4" />
                          {t('viewHomework')}
                        </Button>
                      )}

                      {!submissions[hw.id] ? (
                        <Link href={`/homework/${hw.id}/submit`} className="w-full">
                          <Button variant="gradient" className="rounded-xl h-11 w-full gap-2">
                            <Upload className="w-4 h-4" />
                            {t('submitWork')}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" className="rounded-xl h-11 w-full gap-2 border-emerald-500/30 text-emerald-400 cursor-default hover:bg-transparent">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('done')}
                        </Button>
                      )}
                    </div>

                    {/* Correction Zone */}
                    {correction && (
                      <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-scale-in">
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('correctedStatus')}
                          </span>
                          <span className="text-lg font-black text-white bg-emerald-500/20 px-3 py-1 rounded-xl">
                            {correction.grade}/20
                          </span>
                        </div>
                        {correction.comment && (
                          <p className="text-xs text-white/60 mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                            {correction.comment}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                          onClick={() => window.open(correction.pdf_url, '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('viewCorrection')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

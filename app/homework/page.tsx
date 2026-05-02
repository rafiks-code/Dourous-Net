'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Calendar, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function HomeworkPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [homeworkList, setHomeworkList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: homeworksData } = await supabase
        .from('homework')
        .select(`
          id, title, description, due_date, created_at,
          professors ( full_name, subject ),
          submissions ( id, status, submitted_at, file_url, content, student_id )
        `)
        .order('due_date', { ascending: true })

      const formatted = homeworksData?.map(hw => {
        // Find the submission for the current user
        const userSubmission = hw.submissions?.find((s: any) => s.student_id === user.id)
        return {
          ...hw,
          submission: userSubmission
        }
      }) ?? []

      setHomeworkList(formatted)
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
  }

  return (
    <div className="page-container max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            {t('homeworkTitle')}
          </h1>
          <p className="text-white/50 mt-2">
            {t('homeworkSubtitle')}
          </p>
        </div>

        {homeworkList.length === 0 ? (
          <div className="glass-card p-16 text-center animate-scale-in">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('noHomework')}</h3>
            <p className="text-white/50 max-w-sm mx-auto">
              {t('noHomeworkDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {homeworkList.map((hw: any) => {
              const isOverdue = new Date(hw.due_date) < new Date() && !hw.submission
              const isSubmitted = !!hw.submission

              return (
                <div key={hw.id} className="glass-card p-6 flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="gap-1.5">
                      {hw.professors?.subject ?? t('subject')}
                    </Badge>
                    <Badge variant={isSubmitted ? 'success' : isOverdue ? 'warning' : 'info'} className="gap-1 text-xs">
                      {isSubmitted ? <FileText className="w-3.5 h-3.5" /> : isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {isSubmitted ? t('homeworkSubmitted') : isOverdue ? t('overdue') : t('todo')}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{hw.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-3">
                    {hw.description}
                  </p>

                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-4 text-xs text-white/40 bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{t('deadline')}: {formatDate(hw.due_date)}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${language === 'ar' ? 'border-r pr-4' : 'border-l pl-4'} border-white/10`}>
                        <span>{t('professor')} {hw.professors?.full_name}</span>
                      </div>
                    </div>

                    {isSubmitted ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-400">{t('homeworkSubmitted')}</p>
                          <p className="text-xs text-emerald-400/60">{t('submittedOn')} {formatDate(hw.submission.submitted_at)}</p>
                        </div>
                        <a href={hw.submission.file_url || hw.submission.content} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                            {t('viewCopy')}
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <Link href={`/homework/${hw.id}/submit`}>
                        <Button variant="gradient" className="w-full gap-2">
                          <FileText className="w-4 h-4" />
                          {t('submitWork')}
                        </Button>
                      </Link>
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

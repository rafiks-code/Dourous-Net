'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, ClipboardList, CheckCircle, Clock, TrendingUp, Loader2, FileText, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { formatDate } from '@/lib/utils'

export default function ProfDashboardPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [prof, setProf] = useState<any>(null)
  const [stats, setStats] = useState({ lessonsCount: 0, homeworkCount: 0, correctedCount: 0, pendingCount: 0 })
  const [recentHomework, setRecentHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profData } = await supabase
        .from('professors')
        .select('*')
        .eq('id', user.id)
        .single()
      setProf(profData)

      // Count lessons published by this professor
      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)

      // Count homework published by this professor
      const { count: homeworkCount } = await supabase
        .from('homework')
        .select('*', { count: 'exact', head: true })
        .eq('prof_id', user.id)

      // Count corrected submissions for this professor's homework
      const { data: profHomework } = await supabase
        .from('homework')
        .select('id')
        .eq('prof_id', user.id)

      const homeworkIds = (profHomework ?? []).map(h => h.id)

      const { count: correctedCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('homework_id', homeworkIds.length > 0 ? homeworkIds : ['none'])
        .eq('status', 'corrigé')

      const { count: pendingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('homework_id', homeworkIds.length > 0 ? homeworkIds : ['none'])
        .eq('status', 'soumis')

      setStats({
        lessonsCount: lessonsCount || 0,
        homeworkCount: homeworkCount || 0,
        correctedCount: correctedCount || 0,
        pendingCount: pendingCount || 0
      })

      // Recent Submissions with Student name and File link
      const { data: recent } = await supabase
        .from('submissions')
        .select('id, created_at, file_url, student_id, homework!inner(title, prof_id)')
        .eq('homework.prof_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch student names for these submissions
      if (recent && recent.length > 0) {
        const studentIds = Array.from(new Set(recent.map(r => r.student_id)))
        const { data: studentData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds)
        
        const nameMap = Object.fromEntries(studentData?.map(s => [s.id, s.full_name]) || [])
        const enriched = recent.map(r => ({
          ...r,
          student_name: nameMap[r.student_id] || t('studentRole')
        }))
        setRecentHomework(enriched)
      } else {
        setRecentHomework([])
      }
      
      setLoading(false)
    }

    loadData()
  }, [router, supabase, t])

  if (loading) {
    return <div className="flex justify-center p-12 text-white/50">{t('loading')}</div>
  }

  return (
    <div className="page-container max-w-6xl mx-auto py-10 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">{t('profHello')} {prof?.full_name ?? ''}</h1>
          <p className="text-white/50 mt-1">{t('profSubject')} : {prof?.subject ?? '—'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-indigo-500">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.lessonsCount}</p>
              <p className="text-xs text-white/40">{t('totalLessons')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-violet-500">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.homeworkCount}</p>
              <p className="text-xs text-white/40">{t('totalHomework')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.correctedCount}</p>
              <p className="text-xs text-white/40">{t('corrected')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.pendingCount}</p>
              <p className="text-xs text-white/40">{t('pending')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {t('pendingSubmissions')}
            </h2>
            
            {recentHomework.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">{t('student')}</th>
                      <th className="py-3 px-4 font-bold">{t('homework')}</th>
                      <th className="py-3 px-4 font-bold">{t('date')}</th>
                      <th className="py-3 px-4 font-bold text-center">{t('file')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentHomework.map((sub) => (
                      <tr key={sub.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-medium">{sub.student_name}</td>
                        <td className="py-4 px-4 text-white/60">{sub.homework?.title}</td>
                        <td className="py-4 px-4 text-white/40 text-sm">{formatDate(sub.created_at)}</td>
                        <td className="py-4 px-4 text-center">
                          <a 
                            href={sub.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-xs font-bold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t('viewSubmission')}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 italic">{t('noActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

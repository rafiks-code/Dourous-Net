'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Users, ClipboardList, CheckCircle2, TrendingUp, Loader2, FileText, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { formatDate } from '@/lib/utils'

export default function ProfDashboardPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [prof, setProf] = useState<any>(null)
  const [stats, setStats] = useState({ students: 0, lessons: 0, pending: 0, homeworkSubmissions: 0 })
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

      // Stats
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
      const { count: lCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('prof_id', user.id)
      
      // CHANGE 3 - Homework submissions count
      const { count: hsCount } = await supabase
        .from('submissions')
        .select('id, homework!inner(prof_id)', { count: 'exact', head: true })
        .eq('homework.prof_id', user.id)

      setStats({
        students: sCount || 0,
        lessons: lCount || 0,
        pending: 0, // Legacy field
        homeworkSubmissions: hsCount || 0
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
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.students}</p>
              <p className="text-xs text-white/40">{t('totalStudents')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.lessons}</p>
              <p className="text-xs text-white/40">{t('totalLessons')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-blue-500">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.homeworkSubmissions}</p>
              <p className="text-xs text-white/40">{t('submissions')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-white/10">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{t('active')}</p>
              <p className="text-xs text-white/40">{t('accountStatus')}</p>
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

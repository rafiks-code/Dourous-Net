'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Users, ClipboardList, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export default function ProfDashboardPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [prof, setProf] = useState<any>(null)
  const [stats, setStats] = useState({ students: 0, lessons: 0, pending: 0 })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
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

      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
      const { count: lCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('prof_id', user.id)
      const { count: pCount } = await supabase.from('submissions').select('id, homework!inner(prof_id)').eq('homework.prof_id', user.id)
      
      setStats({
        students: sCount || 0,
        lessons: lCount || 0,
        pending: pCount || 0
      })

      const { data: recent } = await supabase
        .from('submissions')
        .select('id, submitted_at, students(full_name), homework!inner(title)')
        .eq('homework.prof_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5)
      
      setRecentSubmissions(recent || [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
  }

  return (
    <div className="page-container max-w-6xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">{t('hello')} {prof?.full_name ?? ''}</h1>
          <p className="text-white/50 mt-1">{t('authSubject')} : {prof?.subject ?? '—'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-indigo-500">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.students}</p>
              <p className="text-xs text-white/40">{t('studentsCount')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.lessons}</p>
              <p className="text-xs text-white/40">{t('lessonsPublished')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.pending}</p>
              <p className="text-xs text-white/40">{t('toCorrect')}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-blue-500">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{t('active')}</p>
              <p className="text-xs text-white/40">{t('accountStatus')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> 
              {t('recentActivity')}
            </h2>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((sub: any) => (
                  <div key={sub.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sub.students?.full_name}</p>
                      <p className="text-xs text-white/40">{t('homeworkTitle')}: {sub.homework?.title}</p>
                    </div>
                    <span className="text-[10px] text-white/30 bg-black/20 px-2 py-1 rounded">
                      {t('new')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 italic">{t('noRecentActivity')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

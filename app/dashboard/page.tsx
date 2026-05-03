'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { MODULE_ICONS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User, GraduationCap, BookOpen, ClipboardList,
  FileText, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function DashboardPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()
      setStudent(studentData)

      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, homework(title, subject, due_date)')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
      setSessions(submissions || [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return <div className="flex justify-center p-12 text-white/50">{t('loading')}</div>
  }

  const sessionList = sessions
  const submitted = sessionList.filter((s) => s.status === 'soumis' || s.status === 'submitted').length
  const corrected = sessionList.filter((s) => s.status === 'corrigé' || s.status === 'corrected').length
  const pending = sessionList.filter((s) => s.status === 'en attente' || s.status === 'pending').length

  const fullName = student?.full_name || user?.user_metadata?.full_name || t('student')
  const level = student?.level || user?.user_metadata?.level || ''
  const filiere = student?.filiere || user?.user_metadata?.filiere || ''
  
  const initials = fullName && fullName !== t('student')
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const statusVariant = (status: string) => {
    if (status === 'corrigé' || status === 'corrected') return 'success'
    if (status === 'soumis' || status === 'submitted') return 'info'
    return 'warning'
  }

  const statusIcon = (status: string) => {
    if (status === 'corrigé' || status === 'corrected') return <CheckCircle2 className="w-3.5 h-3.5" />
    if (status === 'soumis' || status === 'submitted') return <Clock className="w-3.5 h-3.5" />
    return <AlertCircle className="w-3.5 h-3.5" />
  }

  const getStatusText = (status: string) => {
    if (status === 'corrigé' || status === 'corrected') return t('corrected')
    if (status === 'soumis' || status === 'submitted') return t('submitted')
    return t('pending')
  }

  return (
    <div className="page-container max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-20 w-20 shadow-xl shadow-indigo-500/20">
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-black gradient-text">
              {t('hello')}, {fullName}
            </h1>
            <p className="text-white/50 text-sm mt-1">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {level && (
                <Badge variant="info" className="gap-1">
                  <GraduationCap className="w-3 h-3" /> {level}
                </Badge>
              )}
              {filiere && (
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="w-3 h-3" /> {filiere}
                </Badge>
              )}
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t('active')}
              </Badge>
            </div>
          </div>
          <div className={`text-xs text-white/30 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
            <p>{t('memberSince')}</p>
            <p className="text-white/50">{user?.created_at ? formatDate(user.created_at) : '—'}</p>
          </div>
        </div>

        <Separator />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('submissions'), value: sessionList.length, icon: <ClipboardList className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: t('submitted'), value: submitted, icon: <Clock className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: t('corrected'), value: corrected, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: t('pending'), value: pending, icon: <AlertCircle className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sessions table */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              {t('mySubmissions')}
            </h2>
            <Link
              href="/lessons"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {t('browseModules')}
            </Link>
          </div>

          {sessionList.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-white/40">{t('noSubmissions')}</p>
              <Link href="/lessons" className="inline-block mt-4 text-indigo-400 text-sm hover:text-indigo-300">
                {t('browseModules')} {language === 'ar' ? '←' : '→'}
              </Link>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">{t('tableModule')}</div>
                <div className="col-span-3">{t('tableDate')}</div>
                <div className="col-span-2">{t('tableStatus')}</div>
                <div className="col-span-3 text-right">{t('tableFile')}</div>
              </div>
              <div className="divide-y divide-white/5">
                {sessionList.map((session) => (
                  <div key={session.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {MODULE_ICONS[session.homework?.subject] ?? '📘'}
                      </span>
                      <span className="text-sm font-medium text-white truncate">
                        {session.homework?.title || session.module}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5 text-sm text-white/50">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(session.submitted_at || session.date)}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={statusVariant(session.status)} className="gap-1 text-xs">
                        {statusIcon(session.status)}
                        {getStatusText(session.status)}
                      </Badge>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      {session.file_url ? (
                        <a
                          href={session.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {t('viewPDF')}
                        </a>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Profile info card */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-violet-400" />
            {t('profileInfo')}
          </h2>
          <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: t('fullName'), value: fullName !== t('student') ? fullName : '—', icon: <User className="w-4 h-4" /> },
              { label: t('email'), value: user?.email ?? '—', icon: <TrendingUp className="w-4 h-4" /> },
              { label: t('level'), value: level || '—', icon: <GraduationCap className="w-4 h-4" /> },
              { label: t('filiere'), value: filiere || '—', icon: <BookOpen className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">{item.label}</p>
                  <p className="text-sm font-medium text-white truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

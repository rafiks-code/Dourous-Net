'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getFromStorage, formatDate } from '@/lib/utils'
import { STORAGE_KEYS, MODULE_ICONS, MODULE_ARABIC, FILIERE_ARABIC, type Level, type Filiere } from '@/lib/constants'
import { useLanguage } from '@/lib/language-context'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Download, Upload, FileText, CheckCircle2,
  Clock, ArrowLeft, ArrowRight, AlertCircle, Loader2, BookOpen, ClipboardList, Star
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Course {
  id: string
  title: string
  file_url: string
  created_at: string
  description?: string
}

interface Homework {
  id: string
  title: string
  file_url: string
  due_date: string
  created_at: string
}

interface Session {
  id: string
  status: string
  file_url: string | null
  submitted_at: string
  date: string
  file_name?: string
}

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const currentModule = decodeURIComponent(params.name as string)
  const icon = MODULE_ICONS[currentModule] ?? '📘'

  const { language, t } = useLanguage()
  const displayName = language === 'ar' ? (MODULE_ARABIC[currentModule] || currentModule) : currentModule
  const [courses, setCourses] = useState<Course[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [filiere, setFiliere] = useState<Filiere | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [grades, setGrades] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    // 1. Fetch courses (lessons) for this module
    const { data: coursesData } = await supabase
      .from('lessons')
      .select('*')
      .eq('module', currentModule)
      .order('created_at', { ascending: false })
    setCourses(coursesData ?? [])

    // 2. Fetch homework for this module
    const { data: hwData } = await supabase
      .from('homework')
      .select('*')
      .eq('module', currentModule)
      .order('due_date', { ascending: true })
    setHomework(hwData ?? [])

    // Get student row for ID consistency
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('id', user.id)
      .single()

    const studentId = studentData?.id || user.id

    // 3. Load submissions for this student
    const { data: sessionsData } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .eq('module', currentModule)
      .order('submitted_at', { ascending: false })
    setSessions(sessionsData ?? [])

    // 4. Load grades for this module + student
    const { data: gradesData } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('module', currentModule)
      .order('created_at', { ascending: false })
    setGrades(gradesData ?? [])

    setLoading(false)
  }, [currentModule, router])

  useEffect(() => {
    const storedLevel = getFromStorage(STORAGE_KEYS.LEVEL) as Level
    const storedFiliere = getFromStorage(STORAGE_KEYS.FILIERE) as Filiere
    if (storedLevel) setLevel(storedLevel)
    if (storedFiliere) setFiliere(storedFiliere)
    loadData()
  }, [loadData])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.type !== 'application/pdf') {
      setUploadMsg(t('invalidFileType'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg(t('fileTooLarge'))
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadMsg('')

    const supabase = createClient()

    try {
      // 1. Get student ID
      const { data: { user } } = await supabase.auth.getUser()
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (!studentData) throw new Error(t('studentNotFound'))

      // 2. Sanitize file name
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${studentData.id}/${Date.now()}_${sanitizedName}`

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 85))
      }, 200)

      // 3. Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      clearInterval(progressInterval)
      if (uploadError) throw uploadError

      setUploadProgress(90)

      // 4. Get URL and insert
      const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(uploadData.path)

      const { error: sessionError } = await supabase.from('submissions').insert({
        student_id: studentData.id,
        homework_id: homework[0]?.id || null,
        file_url: publicUrl,
        file_name: file.name,
        status: 'soumis',
        submitted_at: new Date().toISOString(),
      })

      if (sessionError) throw sessionError

      setUploadProgress(100)
      setUploadMsg(`✅ ${t('success')}`)
      await loadData()

    } catch (err: any) {
      console.error(err)
      setUploadMsg(`❌ ${t('error')}: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Link href="/modules" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('back')}
        </Link>

        <div className="mb-4 flex items-center gap-2">
          {level && (
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
              {level}
            </span>
          )}
          {level && filiere && <span className="text-white/30">·</span>}
          {filiere && (
            <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
              {language === 'ar' ? FILIERE_ARABIC[filiere] || filiere : filiere}
            </span>
          )}
        </div>

        <div className={cn("flex items-center gap-4 mb-10", language === 'ar' ? "flex-row-reverse" : "flex-row")}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center text-3xl border border-white/10 flex-shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black gradient-text">{displayName}</h1>
            <p className="text-white/50 text-sm mt-1">
              {courses.length} {t('lessons')} · {homework.length} {t('homework')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="glass-card p-6">
              <div className={cn("flex items-center gap-3 mb-5", language === 'ar' ? "flex-row-reverse" : "flex-row")}>
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">{t('lessons')}</h2>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('noLessons')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{course.title}</p>
                        <p className="text-xs text-white/40">{formatDate(course.created_at)}</p>
                      </div>
                      <a href={course.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all flex-shrink-0">
                        <Download className="w-3.5 h-3.5" />
                        {t('openDocument')}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card p-6">
              <div className={cn("flex items-center gap-3 mb-5", language === 'ar' ? "flex-row-reverse" : "flex-row")}>
                <ClipboardList className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold">{t('homework')}</h2>
              </div>
              {homework.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('noHomework')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {homework.map((hw) => (
                    <div key={hw.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{hw.title}</p>
                        <p className="text-xs text-amber-400/80 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('deadline')} : {formatDate(hw.due_date)}
                        </p>
                      </div>
                      <a href={hw.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all flex-shrink-0">
                        <Download className="w-3.5 h-3.5" />
                        {t('viewHomework')}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Grades section for this module */}
            <section className="glass-card p-6">
              <div className={cn("flex items-center gap-3 mb-5", language === 'ar' ? "flex-row-reverse" : "flex-row")}>
                <Star className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold">{t('grades')}</h2>
              </div>
              {grades.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('noGrades')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grades.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{g.module}</p>
                        <p className="text-xs text-white/30">{formatDate(g.created_at)}</p>
                      </div>
                      <span className={cn(
                        "text-xl font-black",
                        g.grade >= 16 ? 'text-green-400' : g.grade >= 12 ? 'text-blue-400' : g.grade >= 10 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {g.grade}<span className="text-xs text-white/30 font-normal">/20</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                {t('submitWork')}
              </h2>
              <div
                className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/20 group-hover:text-indigo-400 transition-colors" />
                <p className="text-sm text-white/50 group-hover:text-white/70">
                  {t('searchPlaceholder')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{t('loading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              {uploadMsg && (
                <div className={cn("mt-3 flex items-center gap-2 text-xs p-2 rounded-lg",
                  uploadMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                  {uploadMsg.includes('✅') ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {uploadMsg}
                </div>
              )}
            </section>

            <section className="glass-card p-6">
              <h2 className="text-base font-bold mb-4 text-white/80">
                {t('mySubmissions')}
              </h2>
              {sessions.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">
                  {t('noSubmissions')}
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white/50">{formatDate(s.submitted_at || s.date)}</p>
                        <Badge
                          variant={s.status === 'corrigé' || s.status === 'corrected' ? 'success' : s.status === 'soumis' || s.status === 'submitted' ? 'info' : 'warning'}
                          className="text-xs"
                        >
                          {t(s.status) || s.status}
                        </Badge>
                      </div>
                      {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                          <FileText className="w-3 h-3" />
                          {s.file_name || t('openDocument')}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
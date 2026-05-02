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
  Clock, ArrowLeft, AlertCircle, Loader2, BookOpen, ClipboardList
} from 'lucide-react'
import Link from 'next/link'

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
  date: string
  created_at: string
}

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const moduleName = decodeURIComponent(params.name as string)
  const icon = MODULE_ICONS[moduleName] ?? '📘'

  const { language, t } = useLanguage()
  const displayName = language === 'ar' ? (MODULE_ARABIC[moduleName] || moduleName) : moduleName
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

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    // Load courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('module', moduleName)
      .order('created_at', { ascending: false })
    setCourses(coursesData ?? [])

    // Load homework
    const { data: hwData } = await supabase
      .from('homework')
      .select('*')
      .eq('module', moduleName)
      .order('due_date', { ascending: true })
    setHomework(hwData ?? [])

    // Load student sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', user.id)
      .eq('module', moduleName)
      .order('created_at', { ascending: false })
    setSessions(sessionsData ?? [])

    setLoading(false)
  }, [moduleName, router])

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
      setUploadMsg(language === 'ar' ? 'الرجاء رفع ملف PDF فقط' : 'Veuillez uploader un fichier PDF uniquement.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg(language === 'ar' ? 'الملف أكبر من 10 ميغابايت' : 'Le fichier dépasse 10 Mo.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadMsg('')

    const supabase = createClient()
    const fileName = `${userId}/${moduleName}/${Date.now()}_${file.name}`

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 85))
    }, 200)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('devoirs')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    clearInterval(progressInterval)

    if (uploadError) {
      setUploadMsg(`Erreur: ${uploadError.message}`)
      setUploading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(90)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('devoirs').getPublicUrl(uploadData.path)

    // Save session record
    const { error: sessionError } = await supabase.from('sessions').insert({
      student_id: userId,
      module: moduleName,
      status: 'soumis',
      file_url: publicUrl,
      date: new Date().toISOString(),
    })

    setUploadProgress(100)

    if (sessionError) {
      setUploadMsg(`Erreur d'enregistrement: ${sessionError.message}`)
    } else {
      setUploadMsg(language === 'ar' ? '✅ تم رفع الملف بنجاح!' : '✅ Devoir soumis avec succès!')
      await loadData()
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`page-container max-w-4xl mx-auto ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Back */}
        <Link href="/modules" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة إلى الوحدات' : 'Retour aux modules'}
        </Link>

        {/* Module header */}
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
        
        <div className={`flex items-center gap-4 mb-10 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center text-3xl border border-white/10 flex-shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black gradient-text">
              {displayName}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {courses.length} {language === 'ar' ? 'دروس' : 'cours'} · {homework.length} {language === 'ar' ? 'واجبات' : 'devoirs'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Courses + Homework */}
          <div className="lg:col-span-2 space-y-6">
            {/* Courses */}
            <section className="glass-card p-6">
              <div className={`flex items-center gap-3 mb-5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">{language === 'ar' ? 'الدروس المتاحة' : 'Cours disponibles'}</h2>
                <Badge variant="info" className="ml-auto">{courses.length}</Badge>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{language === 'ar' ? 'لا توجد دروس متاحة' : 'Aucun cours disponible'}</p>
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
                      <a
                        href={course.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'فتح الملف' : 'Ouvrir le document'}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Homework list */}
            <section className="glass-card p-6">
              <div className={`flex items-center gap-3 mb-5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <ClipboardList className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold">{language === 'ar' ? 'الواجبات' : 'Devoirs'}</h2>
                <Badge variant="warning" className="ml-auto">{homework.length}</Badge>
              </div>

              {homework.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{language === 'ar' ? 'لا توجد واجبات' : 'Aucun devoir'}</p>
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
                          {language === 'ar' ? 'الموعد:' : 'Rendu le'} {formatDate(hw.due_date)}
                        </p>
                      </div>
                      <a
                        href={hw.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'فتح الملف' : 'Ouvrir le document'}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column: Upload + Sessions */}
          <div className="space-y-6">
            {/* Upload */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                {language === 'ar' ? 'رفع واجب' : 'Soumettre un devoir'}
              </h2>

              <div
                className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/20 group-hover:text-indigo-400 transition-colors" />
                <p className="text-sm text-white/50 group-hover:text-white/70">
                  {language === 'ar' ? 'انقر لاختيار ملف PDF' : 'Cliquer pour choisir un PDF'}
                </p>
                <p className="text-xs text-white/30 mt-1">Max 10 Mo</p>
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
                    <span>{language === 'ar' ? 'جارٍ الرفع...' : 'Upload en cours...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {uploadMsg && (
                <div className={`mt-3 flex items-center gap-2 text-xs p-2 rounded-lg ${uploadMsg.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {uploadMsg.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {uploadMsg}
                </div>
              )}
            </section>

            {/* My submissions */}
            <section className="glass-card p-6">
              <h2 className="text-base font-bold mb-4 text-white/80">
                {language === 'ar' ? 'تسليماتي' : 'Mes soumissions'}
              </h2>
              {sessions.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">
                  {language === 'ar' ? 'لم ترفع أي واجب بعد' : 'Aucune soumission'}
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white/50">{formatDate(s.date)}</p>
                        <Badge
                          variant={s.status === 'corrigé' ? 'success' : s.status === 'soumis' ? 'info' : 'warning'}
                          className="text-xs"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                          <FileText className="w-3 h-3" />
                          {language === 'ar' ? 'فتح الملف' : 'Ouvrir le document'}
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

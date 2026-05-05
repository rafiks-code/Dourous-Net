'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SubmitHomeworkPage() {
  const params = useParams()
  const router = useRouter()
  const { language, t } = useLanguage()
  const homeworkId = params.id as string

  const [homework, setHomework] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadHomework()
  }, [homeworkId])

  async function loadHomework() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Load homework details
      const { data: hw } = await supabase
        .from('homework')
        .select('*')
        .eq('id', homeworkId)
        .single()

      setHomework(hw)

      // Check if already submitted
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single()

      if (student) {
        const { data: existing } = await supabase
          .from('submissions')
          .select('id')
          .eq('homework_id', homeworkId)
          .eq('student_id', student.id)
          .single()

        if (existing) setAlreadySubmitted(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

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

    try {
      // Get auth user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Get student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!studentData) throw new Error('Profil étudiant non trouvé')

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${studentData.id}/${Date.now()}_${sanitizedName}`

      // Progress simulation
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 85))
      }, 200)

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      clearInterval(interval)
      if (uploadError) throw uploadError

      setUploadProgress(90)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path)

      // Insert into submissions
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: studentData.id,
          homework_id: homeworkId,
          file_url: publicUrl,
          file_name: file.name,
          status: 'soumis',
          submitted_at: new Date().toISOString(),
        })

      if (insertError) throw insertError

      setUploadProgress(100)
      setAlreadySubmitted(true)
      setUploadMsg(language === 'ar' ? '✅ تم إرسال عملك بنجاح!' : '✅ Travail soumis avec succès !')

    } catch (err: any) {
      console.error(err)
      setUploadMsg(`❌ Erreur: ${err.message}`)
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
    <div className="page-container max-w-2xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Link href="/homework" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t('back')}
      </Link>

      <div className="glass-card p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black gradient-text">
              {t('submitWork')}
            </h1>
            {homework && (
              <p className="text-white/50 text-sm mt-0.5">{homework.title}</p>
            )}
          </div>
        </div>

        {/* Homework info */}
        {homework && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <p className="text-sm text-white/70">
              <span className="text-indigo-300 font-medium">{homework.subject}</span>
              {homework.due_date && (
                <span className="text-white/40 ml-2">
                  · {t('deadline')}: {new Date(homework.due_date).toLocaleDateString('fr-FR')}
                </span>
              )}
            </p>
            {homework.description && (
              <p className="text-xs text-white/40 mt-1">{homework.description}</p>
            )}
          </div>
        )}

        {/* Already submitted */}
        {alreadySubmitted && !uploadMsg ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm font-medium">
              {language === 'ar' ? 'لقد أرسلت عملك بالفعل' : 'Vous avez déjà soumis ce devoir'}
            </p>
          </div>
        ) : (
          <>
            {/* Upload zone */}
            <div
              className="border-2 border-dashed border-white/15 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-white/20 group-hover:text-indigo-400 transition-colors" />
              <p className="text-white/50 group-hover:text-white/70 text-sm">
                {language === 'ar' ? 'انقر لرفع ملف PDF' : 'Cliquez pour uploader un PDF'}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {language === 'ar' ? 'الحد الأقصى 10 ميغابايت' : 'Maximum 10 Mo'}
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

            {/* Progress */}
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>{t('loading')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </>
        )}

        {/* Message */}
        {uploadMsg && (
          <div className={cn(
            "mt-4 flex items-center gap-2 text-sm p-3 rounded-xl",
            uploadMsg.includes('✅')
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}>
            {uploadMsg.includes('✅')
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {uploadMsg}
          </div>
        )}

        {/* Back button after success */}
        {uploadMsg.includes('✅') && (
          <button
            onClick={() => router.push('/homework')}
            className="mt-4 w-full py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition-all"
          >
            {t('back')}
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function SubmitHomeworkPage() {
  const { id: devoirId } = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [devoir, setDevoir] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDevoir() {
      const { data } = await supabase
        .from('homework')
        .select('*')
        .eq('id', devoirId)
        .single()
      setDevoir(data)
    }
    fetchDevoir()
  }, [devoirId, supabase])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')

    try {
      // 1. Vérifier l'auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('unauthorized'))

      // 2. Chercher l'étudiant UNIQUEMENT par email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single()

      if (studentError || !studentData) {
        console.log('Email cherché:', user.email)
        console.log('Erreur Supabase:', studentError)
        throw new Error(t('studentNotFound'))
      }

      // 3. Upload to storage
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${studentData.id}/${Date.now()}_${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName)

      // 4. Insert into submissions
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: studentData.id,
          homework_id: devoirId,
          file_url: urlData.publicUrl,
          file_name: file.name
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/homework')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('error'))
    } finally {
      setUploading(false)
    }
  }

  if (!devoir) return <div className="p-12 text-center text-white/50">{t('loading')}</div>

  return (
    <div className="page-container max-w-2xl mx-auto py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/homework" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group">
        <ArrowLeft className={isAr ? "w-4 h-4 rotate-180" : "w-4 h-4 group-hover:-translate-x-1 transition-transform"} />
        {t('back')}
      </Link>

      <div className="glass-card p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">{t('submitHomework')}</h1>
          <p className="text-white/50">{devoir.title}</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('success')}</h2>
              <p className="text-white/40">{t('homeworkSubmittedSuccess')}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500/50 transition-all group bg-white/5 hover:bg-white/8"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {file ? <FileText className="w-8 h-8 text-indigo-400" /> : <Upload className="w-8 h-8 text-indigo-400" />}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-white font-bold">{file.name}</p>
                      <p className="text-white/30 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-bold">{t('clickToUpload')}</p>
                      <p className="text-white/30 text-xs">PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('submitHomework')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

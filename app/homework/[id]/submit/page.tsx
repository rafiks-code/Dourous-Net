'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, ArrowLeft, ArrowRight, Loader2, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'
import { cn } from '@/lib/utils'

export default function SubmitHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const supabase = createClient()
  const [homework, setHomework] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('homework').select('*').eq('id', params.id).single()
      if (data) setHomework(data)
      setFetching(false)
    }
    load()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase.from('submissions').insert({
          homework_id: params.id,
          student_id: user.id,
          file_url: url,
          status: 'pending', // Use standard 'pending' status
          created_at: new Date().toISOString()
        })

        if (error) throw error
      }
      
      router.push('/homework')
      router.refresh()
    } catch (err) {
      console.error('Submission error:', err)
      alert(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="page-container max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl mx-auto py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/homework" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-8 group transition-colors">
        {isAr ? <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />} 
        {t('backToHomework')}
      </Link>
      
      <div className="glass-card p-10 animate-scale-in border-blue-500/20 border shadow-2xl shadow-blue-500/5">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-inner">
            <UploadCloud className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t('submitAHomework')}</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            {homework?.subject}
          </div>
          <p className="text-white/60 text-lg font-bold mt-4">{homework?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label className="text-white/70 text-sm font-bold ml-1">{language === 'ar' ? 'قم برفع ملف الحل (PDF)' : 'Uploadez votre solution (PDF)'}</Label>
            <PDFUpload 
              bucket="submissions" 
              onUpload={(url) => setUrl(url)}
            />
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              {isAr 
                ? 'يرجى التأكد من أن الملف هو النسخة النهائية. بمجرد الإرسال، سيتمكن الأستاذ من رؤية عملك وبدء التصحيح.' 
                : 'Veuillez vous assurer que le fichier est la version finale. Une fois envoyé, votre professeur pourra voir votre travail et commencer la correction.'}
            </p>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full py-7 font-black text-lg shadow-xl shadow-blue-500/20 from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" 
            disabled={loading || !url}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> {t('sending')}</>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-3" />
                {t('confirmSend')}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

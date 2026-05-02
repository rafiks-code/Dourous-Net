'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, ArrowLeft, ArrowRight, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'

export default function SubmitHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t, language } = useLanguage()
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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('submissions').insert({
        homework_id: params.id,
        student_id: user.id,
        file_url: url,
        content: url, // Fallback for existing columns
        status: 'soumis'
      })
    }
    
    router.push('/homework')
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="page-container max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Link href="/homework" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 mb-6">
        {language === 'ar' ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />} 
        {t('backToHomework')}
      </Link>
      
      <div className="glass-card p-8 animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <UploadCloud className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('submitAHomework')}</h1>
          <p className="text-white/50 text-sm mt-2">{homework?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>{language === 'ar' ? 'ملف الواجب (PDF)' : 'Fichier du devoir (PDF)'}</Label>
            <div className="flex flex-col gap-2">
              <PDFUpload 
                bucket="submissions" 
                onUpload={(url) => setUrl(url)}
                language={language}
              />
              {url && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ {language === 'ar' ? 'تم رفع الملف بنجاح' : 'Fichier téléchargé avec succès'}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('sending')}</>
            ) : t('confirmSend')}
          </Button>
        </form>
      </div>
    </div>
  )
}

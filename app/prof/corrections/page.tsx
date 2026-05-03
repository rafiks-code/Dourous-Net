'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, FileText, Loader2, AlertCircle, User, ClipboardList, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  homework_id: string
  student_id: string
  file_url: string
  status: string
  created_at: string
  homework: {
    title: string
  }
  student: {
    full_name: string
  }
}

export default function ProfCorrectionsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [form, setForm] = useState({ grade: '', comment: '', pdfUrl: '' })

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        homework:homework_id (title),
        student:student_id (full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading submissions:', error)
    } else {
      setSubmissions(data as any ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub || !form.pdfUrl) return
    
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: corrError } = await supabase
        .from('corrections')
        .insert({
          submission_id: selectedSub.id,
          homework_id: selectedSub.homework_id,
          student_id: selectedSub.student_id,
          prof_id: user?.id,
          file_url: form.pdfUrl,
          grade: parseFloat(form.grade),
          comment: form.comment
        })

      if (corrError) throw corrError

      await supabase
        .from('submissions')
        .update({ status: 'corrected' })
        .eq('id', selectedSub.id)

      setSuccess(true)
      setForm({ grade: '', comment: '', pdfUrl: '' })
      setSelectedSub(null)
      await loadSubmissions()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Correction error:', err)
      alert(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-10 animate-fade-slide-up">
        <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          {t('correctionsTitle')}
        </h1>
        <p className="text-white/50 mt-2">
          {t('manageHomeworkDesc')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4 animate-fade-slide-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('copiesToCorrect')}</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              {submissions.length}
            </span>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-24 skeleton" />
            ))
          ) : submissions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="w-16 h-16 text-white/10 mx-auto mb-4 animate-float" />
              <p className="text-white/40">{t('noCopies')}</p>
            </div>
          ) : (
            submissions.map((sub, index) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={cn(
                  "glass-card p-5 cursor-pointer transition-all duration-300 group border-transparent hover:border-emerald-500/30",
                  selectedSub?.id === sub.id ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "hover:bg-white/5"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <User className="w-5 h-5 text-white/30 group-hover:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{sub.student?.full_name || t('studentRole')}</h3>
                    <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                      <ClipboardList className="w-3 h-3" />
                      {sub.homework?.title}
                    </p>
                  </div>
                  <div className="text-[10px] text-white/20 whitespace-nowrap">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-7 animate-fade-slide-up stagger-2">
          {selectedSub ? (
            <div className="glass-card p-8 border-emerald-500/20 border sticky top-24">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedSub.student?.full_name}</h2>
                  <p className="text-sm text-emerald-400 font-medium">{selectedSub.homework?.title}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(selectedSub.file_url, '_blank')}
                >
                  <FileText className="w-4 h-4" />
                  {t('viewSubmission')}
                </Button>
              </div>

              <form onSubmit={handleCorrect} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="grade">{t('grade')} (/20)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={form.grade}
                      onChange={e => setForm({ ...form, grade: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-lg font-bold text-center"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>{t('homeworkFile')}</Label>
                    <PDFUpload 
                      bucket="corrections" 
                      onUpload={url => setForm({ ...form, pdfUrl: url })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">{t('comment')}</Label>
                  <textarea
                    id="comment"
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                    className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder={t('observationPlaceholder')}
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full py-7 font-bold text-lg shadow-lg shadow-emerald-500/20 from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('sendCorrection')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="glass-card p-20 text-center flex flex-col items-center justify-center border-white/5 border">
              <div className="w-20 h-20 rounded-full bg-emerald-500/5 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/20" />
              </div>
              <h2 className="text-xl font-bold text-white/50 mb-2">{t('selectCopy')}</h2>
              <p className="text-sm text-white/20 max-w-xs">{t('selectCopy')}</p>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 animate-scale-in z-50">
          <div className="glass-card p-4 bg-emerald-500/20 border-emerald-500/40 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-white">{t('correctionSent')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

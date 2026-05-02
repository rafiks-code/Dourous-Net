'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function ProfCorrectionsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSub, setSelectedSub] = useState<any>(null)
  
  const [form, setForm] = useState({ grade: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('submissions')
      .select(`
        id, content, submitted_at, homework_id, student_id,
        students ( full_name, level, filiere ),
        homework!inner ( id, title, prof_id )
      `)
      .eq('homework.prof_id', user.id)
      .order('submitted_at', { ascending: false })

    if (data) setSubmissions(data)
    setLoading(false)
  }

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('professors').select('subject').eq('id', user?.id).single()

    // Add to grades table
    await supabase.from('grades').insert({
      student_id: selectedSub.student_id,
      prof_id: user?.id,
      subject: prof?.subject || 'Devoir',
      grade: form.grade,
      comment: form.comment
    })

    // Delete submission or mark as corrected
    await supabase.from('submissions').delete().eq('id', selectedSub.id)

    setForm({ grade: '', comment: '' })
    setSelectedSub(null)
    await loadSubmissions()
    setSubmitting(false)
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            {t('correction')}
          </h1>
          <p className="text-white/50 mt-1">{t('evaluateHomeworks')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : submissions.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500/20" />
          <p>{t('noPendingCorrections')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-white/70 px-2">{t('toCorrect')} ({submissions.length})</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {submissions.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedSub?.id === sub.id 
                      ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <p className="font-bold mb-1 truncate">{sub.students?.full_name}</p>
                  <p className="text-xs opacity-70 mb-2 truncate">Devoir: {sub.homework?.title}</p>
                  <p className="text-[10px] opacity-50 flex items-center gap-1">
                    Soumis le {formatDate(sub.submitted_at)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSub ? (
              <div className="glass-card p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-bold">{selectedSub.students?.full_name}</h2>
                    <p className="text-sm text-white/50">{selectedSub.students?.level} • {selectedSub.students?.filiere}</p>
                  </div>
                  <a href={selectedSub.content} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="gap-2 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10">
                      <FileText className="w-4 h-4" /> {t('viewCopy')}
                    </Button>
                  </a>
                </div>

                <form onSubmit={handleCorrect} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('grade')} / 20</Label>
                      <Input 
                        type="number" 
                        min="0" max="20" step="0.25"
                        value={form.grade} 
                        onChange={e => setForm({...form, grade: e.target.value})} 
                        required
                        className="text-lg font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('comment')}</Label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                      value={form.comment} 
                      onChange={e => setForm({...form, comment: e.target.value})} 
                      placeholder={t('correctionCommentPlaceholder')}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="gradient" className="from-emerald-500 to-teal-500 shadow-emerald-500/25" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('correct')}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full min-h-[300px] glass-card flex flex-col items-center justify-center text-white/30 p-8 text-center">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>{t('selectCopyToCorrect')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

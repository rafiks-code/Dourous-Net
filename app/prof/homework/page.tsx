'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, Loader2, FileText, Trash2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'
import { cn } from '@/lib/utils'

interface Homework {
  id: string
  title: string
  description: string
  subject: string
  file_url: string
  due_date: string
  prof_id: string
  created_at: string
}

export default function ProfHomeworkPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})

  const [form, setForm] = useState({ title: '', subject: '', description: '', dueDate: '', pdfUrl: '', level: '', filiere: '' })
  const [profSubject, setProfSubject] = useState('')

  const LEVELS = ['1AS', '2AS', '3AS']
  const FILIERES: Record<string, string[]> = {
    '1AS': ['TC Sciences', 'TC Lettres'],
    '2AS': ['Sciences Expérimentales', 'Mathématiques', 'Lettres et Philosophie', 'Langues Étrangères'],
    '3AS': ['Sciences Expérimentales', 'Mathématiques', 'Technique Mathématique', 'Lettres et Philosophie', 'Langues Étrangères', 'Gestion et Économie'],
  }
  const FILIERE_MATIERES: Record<string, string[]> = {
    'TC Sciences': ['Mathématiques', 'Physique', 'Sciences Naturelles', 'Informatique', 'Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique'],
    'TC Lettres': ['Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique', 'Informatique', 'Mathématiques'],
    'Sciences Expérimentales': ['Mathématiques', 'Physique', 'Sciences Naturelles', 'Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique', 'Philosophie'],
    'Mathématiques': ['Mathématiques', 'Physique', 'Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique', 'Philosophie'],
    'Technique Mathématique': ['Mathématiques', 'Physique', 'Génie Civil', 'Génie Mécanique', 'Génie Électrique', 'Génie des Procédés', 'Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique', 'Philosophie'],
    'Lettres et Philosophie': ['Arabe', 'Philosophie', 'Histoire-Géo', 'Français', 'Anglais', 'Éducation Islamique', 'Mathématiques'],
    'Langues Étrangères': ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Allemand', 'Philosophie', 'Histoire-Géo', 'Éducation Islamique', 'Mathématiques'],
    'Gestion et Économie': ['Mathématiques', 'Comptabilité', 'Économie', 'Droit', 'Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Éducation Islamique', 'Philosophie']
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadHomework = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch professor's own module
    const { data: profData } = await supabase
      .from('professors')
      .select('module, subject')
      .eq('id', user.id)
      .single()
    const moduleValue = profData?.module || profData?.subject
    if (moduleValue) {
      setProfSubject(moduleValue)
      setForm(prev => ({ ...prev, subject: moduleValue }))
    }

    const { data, error } = await supabase
      .from('homework')
      .select('*')
      .eq('prof_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading homework:', error)
    } else {
      setHomework(data ?? [])
      if (data) {
        loadSubmissionCounts(data)
      }
    }
    setLoading(false)
  }, [supabase])

  async function loadSubmissionCounts(homeworkList: any[]) {
    const supabaseClient = createClient()
    const counts: Record<string, number> = {}
    for (const hw of homeworkList) {
      const { count } = await supabaseClient
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('homework_id', hw.id)
      counts[hw.id] = count ?? 0
    }
    setSubmissionCounts(counts)
  }

  async function loadSubmissions(homeworkId: string) {
    if (selectedHomeworkId === homeworkId) {
      // Toggle: clicking same homework closes the panel
      setSelectedHomeworkId(null)
      setSubmissions([])
      return
    }
    setLoadingSubmissions(true)
    setSelectedHomeworkId(homeworkId)
    const supabaseClient = createClient()
    const { data } = await supabaseClient
      .from('submissions')
      .select(`
        id, file_url, file_name, status, submitted_at,
        students ( full_name, email )
      `)
      .eq('homework_id', homeworkId)
      .order('submitted_at', { ascending: false })
    setSubmissions(data ?? [])
    setLoadingSubmissions(false)
  }

  async function markAsCorrected(submissionId: string) {
    const supabaseClient = createClient()
    await supabaseClient
      .from('submissions')
      .update({ status: 'corrigé' })
      .eq('id', submissionId)
    // Reload submissions
    if (selectedHomeworkId) loadSubmissions(selectedHomeworkId)
  }

  useEffect(() => {
    loadHomework()
  }, [loadHomework])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.pdfUrl) {
      setError(t('pleaseUploadPDF'))
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('homework')
        .insert({
          title: form.title,
          description: form.description,
          subject: form.subject,
          level: form.level,
          filiere: form.filiere,
          file_url: form.pdfUrl,
          due_date: form.dueDate,
          prof_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSuccess(true)
      setForm({ title: '', subject: '', description: '', dueDate: '', pdfUrl: '', level: '', filiere: '' })
      await loadHomework()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Insert error:', err)
      setError(err.message || t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm(t('deleteConfirm'))) return

    try {
      const fileName = fileUrl.split('/').pop()
      if (fileName) {
        await supabase.storage.from('homework').remove([fileName])
      }

      const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadHomework()
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(t('error'))
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-10 animate-fade-slide-up">
        <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
          <ClipboardList className="w-10 h-10 text-blue-400" />
          {t('manageHomework')}
        </h1>
        <p className="text-white/50 mt-2">
          {t('manageHomeworkDesc')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 animate-fade-slide-up stagger-1">
          <div className="glass-card p-8 border-blue-500/20 border sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              {t('newHomework')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('homeworkTitle')}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={t('homeworkTitle') + '...'}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>


              {/* Matière — locked to professor's own subject */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  {profSubject ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-blue-300 font-semibold flex items-center gap-2">
                      {profSubject}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      required
                      placeholder={t('subjectPlaceholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('level')}</Label>
                  <select
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="" className="bg-[#0a0a1a]">Choisir</option>
                    {LEVELS.map(l => (
                      <option key={l} value={l} className="bg-[#0a0a1a]">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">{t('dueDate')}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('homeworkDesc')}</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={t('descriptionPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t('homeworkFile')}</Label>
                <PDFUpload
                  bucket="homework"
                  onUpload={url => setForm({ ...form, pdfUrl: url })}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-scale-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {t('homeworkCreated')}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full py-6 font-bold text-lg shadow-lg shadow-blue-500/20"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('publishHomework')
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 animate-fade-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('homework')}</h2>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
              {homework.length}
            </span>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-32 skeleton" />
            ))
          ) : homework.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="w-16 h-16 text-white/10 mx-auto mb-4 animate-float" />
              <p className="text-white/40">{t('noHomeworkProf')}</p>
            </div>
          ) : (
            homework.map((hw, index) => (
              <div key={hw.id} className="space-y-4 animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-blue-500/40 transition-all duration-300">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                          {hw.subject}
                        </span>
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {language === 'ar' ? 'آخر أجل:' : 'Échéance:'} {new Date(hw.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {hw.title}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-1 max-w-md">
                        {hw.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 md:flex-none gap-2 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                      onClick={() => loadSubmissions(hw.id)}
                    >
                      <ClipboardList className="w-4 h-4" />
                      {t('viewSubmissions')} ({submissionCounts[hw.id] ?? 0})
                    </Button>
                    <a
                      href={hw.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none"
                    >
                      <Button variant="secondary" size="sm" className="w-full gap-2 hover:bg-white/10">
                        <FileText className="w-4 h-4" />
                        {t('viewHomework')}
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => handleDelete(hw.id, hw.file_url)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedHomeworkId === hw.id && (
                  <div
                    className="glass-card p-6 border-white/10 bg-[#0a0a1a] animate-fade-slide-up"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <h4 className={cn("text-md font-bold mb-4 text-indigo-300 flex items-center gap-2", language === 'ar' ? "text-right flex-row-reverse" : "text-left")}>
                      <ClipboardList className="w-5 h-5" />
                      {t('submissionsFor')} {hw.title}
                    </h4>
                    {loadingSubmissions ? (
                      <div className="flex justify-center items-center p-4 gap-2 text-indigo-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-medium">{t('loadingSubmissions')}</span>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center p-4 text-white/50 text-sm">
                        {t('noSubmissionsYet')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className={cn(
                              "flex flex-col md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors gap-4",
                              language === 'ar' ? "md:flex-row-reverse text-right" : "md:flex-row text-left"
                            )}
                          >
                            <div className="flex-1">
                              <p className={cn("font-bold text-sm text-white flex items-center gap-2", language === 'ar' && "flex-row-reverse")}>
                                👤 {sub.students?.full_name || t('studentName')}
                                <span className="text-xs font-normal text-white/50">📧 {sub.students?.email || t('studentEmail')}</span>
                              </p>
                              <div className={cn(
                                "flex flex-wrap items-center mt-2 gap-3",
                                language === 'ar' ? "flex-row-reverse" : "flex-row"
                              )}>
                                <span className="text-xs text-white/50">📅 {t('submittedOn')} {new Date(sub.submitted_at).toLocaleString()}</span>
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border",
                                  sub.status === 'corrigé'
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                )}>
                                  {sub.status === 'corrigé' ? '🟢 ' + t('statusCorrected') : '🔵 ' + t('statusSubmitted')}
                                </span>
                                <span className={cn("text-xs text-white/40 flex items-center gap-1", language === 'ar' && "flex-row-reverse")}>
                                  📄 {sub.file_name || 'document.pdf'}
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              "flex flex-wrap w-full md:w-auto gap-2",
                              language === 'ar' ? "flex-row-reverse" : "flex-row"
                            )}>
                              <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                                <Button variant="secondary" size="sm" className={cn("w-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-0 h-9 gap-1", language === 'ar' && "flex-row-reverse")}>
                                  📂 {t('viewFile')}
                                </Button>
                              </a>
                              {sub.status !== 'corrigé' ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => markAsCorrected(sub.id)}
                                  className={cn("flex-1 md:flex-none bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border-0 h-9 gap-1", language === 'ar' && "flex-row-reverse")}
                                >
                                  ✏️ {t('markAsCorrected')}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className={cn("flex-1 md:flex-none opacity-50 cursor-not-allowed h-9 text-xs gap-1", language === 'ar' && "flex-row-reverse")}
                                >
                                  ✔️ {t('alreadyCorrected')}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

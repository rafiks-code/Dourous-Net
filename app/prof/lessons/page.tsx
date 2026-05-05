'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Loader2, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  content: string
  subject: string
  file_url: string
  prof_id: string
  created_at: string
}

export default function ProfLessonsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({ title: '', subject: '', description: '', pdfUrl: '', level: '', filiere: '' })
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

  const loadLessons = useCallback(async () => {
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
      .from('lessons')
      .select('*')
      .eq('prof_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading lessons:', error)
    } else {
      setLessons(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

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
        .from('lessons')
        .insert({
          title: form.title,
          content: form.description,
          subject: form.subject,
          level: form.level,
          filiere: form.filiere,
          file_url: form.pdfUrl,
          prof_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSuccess(true)
      setForm({ title: '', subject: '', description: '', pdfUrl: '', level: '', filiere: '' })
      await loadLessons()

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
        await supabase.storage.from('lessons').remove([fileName])
      }

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadLessons()
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(t('error'))
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-10 animate-fade-slide-up">
        <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-indigo-400" />
          {t('manageLessons')}
        </h1>
        <p className="text-white/50 mt-2">
          {t('manageLessonsDesc')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 animate-fade-slide-up stagger-1">
          <div className="glass-card p-8 border-indigo-500/20 border sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              {t('newLesson')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('lessonTitle')}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={t('lessonTitle') + '...'}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Matière — locked to professor's own subject */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  {profSubject ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-indigo-300 font-semibold flex items-center gap-2">
                      {profSubject}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      required
                      placeholder={t('subjectPlaceholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('level')}</Label>
                  <select
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="" className="bg-[#0a0a1a]">Choisir</option>
                    {LEVELS.map(l => (
                      <option key={l} value={l} className="bg-[#0a0a1a]">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('homeworkDesc')}</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('lessonPDF')}</Label>
                <PDFUpload
                  bucket="lessons"
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
                  {t('lessonPublished')}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full py-6 font-bold text-lg shadow-lg shadow-indigo-500/20"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('publish')
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 animate-fade-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('totalLessons')}</h2>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
              {lessons.length}
            </span>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-32 skeleton" />
            ))
          ) : lessons.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4 animate-float" />
              <p className="text-white/40">{t('noLessonsProf')}</p>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-indigo-500/40 transition-all duration-300 animate-fade-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {lesson.subject}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {lesson.title}
                    </h3>
                    {lesson.content && (
                      <p className="text-xs text-white/50 truncate max-w-md">
                        {lesson.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <a
                    href={lesson.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none"
                  >
                    <Button variant="secondary" size="sm" className="w-full gap-2 hover:bg-white/10">
                      <FileText className="w-4 h-4" />
                      {t('openDocument')}
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => handleDelete(lesson.id, lesson.file_url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

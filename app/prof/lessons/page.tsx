'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Loader2, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'
import { LEVELS, FILIERES_BY_LEVEL, type Level, type Filiere, MODULE_ICONS, FILIERE_ARABIC } from '@/lib/constants'
import PDFUpload from '@/components/PDFUpload'

export default function ProfLessonsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({ title: '', description: '', subject: '', pdfUrl: '', level: '', filiere: '' })

  useEffect(() => {
    loadLessons()
  }, [])

  async function loadLessons() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('prof_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setLessons(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('lessons').insert({
      title: form.title,
      content: form.description || '',
      subject: form.subject,
      file_url: form.pdfUrl,
      prof_id: user.id,
      level: form.level || null,
      filiere: form.filiere || null,
    }).select()

    if (insertError) {
      console.error('Insert error:', insertError)
      setError('Erreur sauvegarde: ' + insertError.message)
      setSubmitting(false)
      return
    }

    setForm({ title: '', description: '', subject: '', pdfUrl: '', level: '', filiere: '' })
    setShowForm(false)
    await loadLessons()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteLesson'))) return
    await supabase.from('lessons').delete().eq('id', id)
    loadLessons()
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            {t('lessonsManagement')}
          </h1>
          <p className="text-white/50 mt-1">{t('publishNewLessons')}</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('newLesson')}
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-scale-in border-emerald-500/20 border">
          <h2 className="text-xl font-bold mb-4">{t('newLesson')}</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('lessonTitle')}</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                placeholder={t('lessonTitlePlaceholder')}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المستوى' : 'Niveau'}</Label>
                <select value={form.level} onChange={e => setForm({...form, level: e.target.value, filiere: ''})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'الكل' : 'Tous'}</option>
                  {LEVELS.map(l => <option key={l} value={l} className="bg-[#0d0d25]">{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الشعبة' : 'Filière'}</Label>
                <select value={form.filiere} onChange={e => setForm({...form, filiere: e.target.value})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={!form.level}>
                  <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'الكل' : 'Toutes'}</option>
                  {form.level && FILIERES_BY_LEVEL[form.level as Level].map(f => <option key={f} value={f} className="bg-[#0d0d25]">{language === 'ar' ? (FILIERE_ARABIC[f as Filiere] || f) : f}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المادة' : 'Matière'}</Label>
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'اختر المادة' : 'Sélectionner une matière'}</option>
                {Object.keys(MODULE_ICONS).map(m => <option key={m} value={m} className="bg-[#0d0d25]">{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lessonPdf')}</Label>
              <PDFUpload 
                bucket="lessons" 
                onUpload={(url) => setForm({...form, pdfUrl: url})}
                language={language}
              />
              {form.pdfUrl && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ {language === 'ar' ? 'تم رفع الملف بنجاح' : 'Fichier téléchargé avec succès'}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('cancel')}</Button>
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('publish')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : lessons.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          {t('noLessonsDesc')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map(lesson => (
            <div key={lesson.id} className="glass-card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">{lesson.title}</h3>
              {lesson.level && <p className="text-xs text-white/50 mb-2">{lesson.level} {lesson.filiere}</p>}
              <a href={lesson.file_url || lesson.content} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 flex items-center gap-2 mb-4 hover:underline">
                <FileText className="w-4 h-4" /> {t('openDocument')}
              </a>
              <div className="mt-auto pt-4 border-t border-white/10 flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(lesson.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

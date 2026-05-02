'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Loader2, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'

export default function ProfLessonsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState({ title: '', content: '' })

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

    await supabase.from('lessons').insert({
      title: form.title,
      content: form.content,
      prof_id: user.id
    })

    setForm({ title: '', content: '' })
    setShowForm(false)
    await loadLessons()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return
    await supabase.from('lessons').delete().eq('id', id)
    loadLessons()
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            {t('lessonsTitle')}
          </h1>
          <p className="text-white/50 mt-1">Publiez de nouveaux cours pour vos étudiants.</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('newLesson')}
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-scale-in border-emerald-500/20 border">
          <h2 className="text-xl font-bold mb-4">{t('newLesson')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('lessonTitle')}</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                placeholder="Chapitre 1 : Introduction..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lessonPdf')}</Label>
              <Input 
                type="url"
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})} 
                placeholder="https://..."
                required
              />
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
              <a href={lesson.content} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 flex items-center gap-2 mb-4 hover:underline">
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

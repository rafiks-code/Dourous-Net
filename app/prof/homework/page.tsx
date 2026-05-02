'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, Loader2, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { MODULE_ICONS } from '@/lib/constants'

export default function ProfHomeworkPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [homework, setHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState({ title: '', description: '', due_date: '', subject: '' })

  useEffect(() => {
    loadHomework()
  }, [])

  async function loadHomework() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('homework')
      .select('*')
      .eq('prof_id', user.id)
      .order('due_date', { ascending: true })

    if (data) setHomework(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('homework').insert({
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      subject: form.subject,
      prof_id: user.id
    })

    setForm({ title: '', description: '', due_date: '', subject: '' })
    setShowForm(false)
    await loadHomework()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteHomework'))) return
    await supabase.from('homework').delete().eq('id', id)
    loadHomework()
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            {t('homeworkManagement')}
          </h1>
          <p className="text-white/50 mt-1">{t('createHomeworks')}</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('newHomework')}
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-scale-in border-blue-500/20 border">
          <h2 className="text-xl font-bold mb-4">{t('newHomework')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('homeworkFormTitle')}</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                placeholder={t('homeworkTitlePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('homeworkDescLabel')}</Label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                placeholder={t('homeworkDescPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المادة' : 'Matière'}</Label>
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'اختر المادة' : 'Sélectionner une matière'}</option>
                {Object.keys(MODULE_ICONS).map(m => <option key={m} value={m} className="bg-[#0d0d25]">{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t('dueDate')}</Label>
              <Input 
                type="date"
                value={form.due_date} 
                onChange={e => setForm({...form, due_date: e.target.value})} 
                required
                className="w-full sm:w-auto"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('cancel')}</Button>
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('create')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : homework.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          Vous n'avez pas encore créé de devoir.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {homework.map(hw => (
            <div key={hw.id} className="glass-card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">{hw.title}</h3>
              <p className="text-sm text-white/60 mb-4 whitespace-pre-wrap">{hw.description}</p>
              
              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  À rendre pour le {formatDate(hw.due_date)}
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(hw.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function ProfGradesPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({ student_id: '', grade: '', comment: '' })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      if (authUser) {
        await fetchStudents()
        await fetchGrades(authUser.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, level, filiere')
      .order('full_name')
    if (error) console.error('Error fetching students:', error)
    else setStudents(data || [])
  }

  const fetchGrades = async (profId: string) => {
    const { data, error } = await supabase
      .from('grades')
      .select('id, student_id, grade, comment, created_at, subject, students(full_name, level, filiere)')
      .eq('prof_id', profId)
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching grades:', error)
    else setGrades(data || [])
  }

  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.student_id || !form.grade) {
      alert(t('error'))
      return
    }

    setSubmitting(true)
    const { data: prof } = await supabase.from('professors').select('subject').eq('id', user.id).single()
    const subject = prof?.subject || t('evaluation')

    const { error } = await supabase
      .from('grades')
      .insert({
        student_id: form.student_id,
        prof_id: user.id,
        subject: subject,
        grade: parseFloat(form.grade),
        comment: form.comment || '',
      })

    if (error) {
      alert(t('error'))
      setSubmitting(false)
      return
    }

    setForm({ student_id: '', grade: '', comment: '' })
    setShowForm(false)
    await fetchGrades(user.id)
    setSubmitting(false)
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-400" />
            {t('grades')}
          </h1>
          <p className="text-white/50 mt-1">{t('gradesSubtitle')}</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('addGrade')}
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-scale-in border-indigo-500/20 border">
          <h2 className="text-xl font-bold mb-4">{t('addGrade')}</h2>
          <form onSubmit={saveGrade} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('studentLabel')}</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                  value={form.student_id}
                  onChange={e => setForm({...form, student_id: e.target.value})}
                  required
                >
                  <option value="" className="bg-[#07071a]">{t('searchPlaceholder')}</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#07071a]">
                      {s.full_name} ({s.level} - {s.filiere})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('grade')} / 20</Label>
                <Input 
                  type="number" 
                  min="0" max="20" step="0.25"
                  value={form.grade} 
                  onChange={e => setForm({...form, grade: e.target.value})} 
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('comment')}</Label>
              <Input 
                value={form.comment} 
                onChange={e => setForm({...form, comment: e.target.value})} 
                placeholder={t('comment')}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('cancel')}</Button>
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : grades.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          {t('noGradesProf')}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-3">{t('tableDate')}</div>
            <div className="col-span-4">{t('studentLabel')}</div>
            <div className="col-span-2 text-center">{t('tableGrade')}</div>
            <div className="col-span-3">{t('tableAppreciation')}</div>
          </div>
          <div className="divide-y divide-white/5">
            {grades.map(g => (
              <div key={g.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors">
                <div className="col-span-3 text-sm text-white/50">
                  {formatDate(g.created_at)}
                </div>
                <div className="col-span-4 flex flex-col">
                  <span className="font-medium text-white">{g.students?.full_name}</span>
                  <span className="text-xs text-white/40">{g.students?.level}</span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge variant={Number(g.grade) >= 10 ? 'success' : 'destructive'} className="font-bold">
                    {g.grade}/20
                  </Badge>
                </div>
                <div className="col-span-3 text-sm text-white/70 truncate" title={g.comment}>
                  {g.comment || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

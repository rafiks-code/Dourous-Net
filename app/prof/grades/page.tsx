'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Plus, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function ProfGradesPage() {
  const supabase = createClient()
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({ student_id: '', grade: '', comment: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load grades
    const { data: gradesData } = await supabase
      .from('grades')
      .select('id, student_id, grade, comment, created_at, students(full_name, level)')
      .eq('prof_id', user.id)
      .order('created_at', { ascending: false })
      
    if (gradesData) setGrades(gradesData)

    // Load students for dropdown
    const { data: studentsData } = await supabase.from('students').select('id, full_name, level, filiere').order('full_name')
    if (studentsData) setStudents(studentsData)

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('professors').select('subject').eq('id', user?.id).single()

    await supabase.from('grades').insert({
      student_id: form.student_id,
      prof_id: user?.id,
      subject: prof?.subject || 'Évaluation',
      grade: form.grade,
      comment: form.comment
    })

    setForm({ student_id: '', grade: '', comment: '' })
    setShowForm(false)
    await loadData()
    setSubmitting(false)
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-400" />
            Gestion des Notes
          </h1>
          <p className="text-white/50 mt-1">Consultez et ajoutez des notes manuellement.</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une note
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-scale-in border-indigo-500/20 border">
          <h2 className="text-xl font-bold mb-4">Saisir une nouvelle note</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Élève</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                  value={form.student_id}
                  onChange={e => setForm({...form, student_id: e.target.value})}
                  required
                >
                  <option value="" className="bg-[#07071a]">Sélectionner un élève</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#07071a]">
                      {s.full_name} ({s.level} - {s.filiere})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Note / 20</Label>
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
              <Label>Appréciation</Label>
              <Input 
                value={form.comment} 
                onChange={e => setForm({...form, comment: e.target.value})} 
                placeholder="Bon travail, continuez ainsi..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : grades.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          Vous n'avez pas encore attribué de notes.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-3">Date</div>
            <div className="col-span-4">Élève</div>
            <div className="col-span-2 text-center">Note</div>
            <div className="col-span-3">Appréciation</div>
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

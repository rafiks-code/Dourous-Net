'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Star, Plus, Loader2, AlertCircle, CheckCircle, Trash2, User, BookOpen } from 'lucide-react'

export default function ProfGradesPage() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'

  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    student_id: '',
    module: '',
    grade: '',
  })
  const [profSubject, setProfSubject] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch professor's own module and auto-fill
      const { data: profData } = await supabase
        .from('professors')
        .select('module, subject')
        .eq('id', user.id)
        .single()
      const moduleValue = profData?.module || profData?.subject
      if (moduleValue) {
        setProfSubject(moduleValue)
        setForm(prev => ({ ...prev, module: moduleValue }))
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, level, filiere')
        .order('full_name')
      setStudents(studentsData ?? []) // level/filiere used only for dropdown display, not inserted into grades

      const { data: gradesData, error: gradesErr } = await supabase
        .from('grades')
        .select('*, students(full_name)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (gradesErr) console.error('grades load error:', gradesErr)
      setGrades(gradesData ?? [])

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.student_id || !form.module.trim() || !form.grade) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    const gradeNum = parseFloat(form.grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20) {
      setError('La note doit être entre 0 et 20.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: insertError } = await supabase
        .from('grades')
        .insert({
          teacher_id: user.id,
          student_id: form.student_id,
          module: form.module.trim(),
          grade: gradeNum,
        })

      if (insertError) throw insertError

      setSuccess('Note ajoutée avec succès !')
      setForm({ student_id: '', module: '', grade: '' })
      setShowForm(false)
      loadData()
      setTimeout(() => setSuccess(''), 4000)

    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette note ?')) return
    try {
      const supabase = createClient()
      await supabase.from('grades').delete().eq('id', id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const getGradeColor = (g: number) => {
    if (g >= 16) return 'text-green-400'
    if (g >= 12) return 'text-blue-400'
    if (g >= 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="page-container max-w-6xl mx-auto py-10 px-4" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" />
            {t('gradesTitle')}
          </h1>
          <p className="text-white/50 mt-1">{t('manageHomeworkDesc')}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 transition-colors font-medium border border-indigo-500/20">
          <Plus className="w-4 h-4" />
          {t('addGrade')}
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Form panel */}
        {showForm && (
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Nouvelle note
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Student selector */}
              <div>
                <label className="text-white/50 text-sm mb-1.5 block">
                  {t('studentLabel')} *
                </label>
                <select
                  value={form.student_id}
                  onChange={e => setForm({ ...form, student_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all">
                  <option value="" className="bg-[#1a1a2e]">Choisir un étudiant...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#1a1a2e]">
                      {s.full_name}{s.level ? ` — ${s.level}` : ''}{s.filiere ? ` ${s.filiere}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module — locked to professor's own subject */}
              <div>
                <label className="text-white/50 text-sm mb-1.5 block">
                  Module / Matière *
                </label>
                {profSubject ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-indigo-300 font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    {profSubject}
                    <span className="ml-auto text-white/20 text-xs">{t('profSubject')}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={form.module}
                    onChange={e => setForm({ ...form, module: e.target.value })}
                    placeholder="Ex: Mathématiques, Physique..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                )}
              </div>

              {/* Grade */}
              <div>
                <label className="text-white/50 text-sm mb-1.5 block">
                  Note (sur 20) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="20"
                  step="0.25"
                  value={form.grade}
                  onChange={e => setForm({ ...form, grade: e.target.value })}
                  placeholder="Ex: 15.5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Ajout...</>
                    : <><Star className="w-4 h-4" /> {t('addGrade')}</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grades list */}
        <div className={showForm ? '' : 'lg:col-span-2'}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Notes publiées
            </h2>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {grades.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : grades.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <Star className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/40">{t('noGradesProf')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map(grade => (
                <div
                  key={grade.id}
                  className="glass-card p-5 flex items-center gap-4 hover:border-yellow-500/20 transition-all">

                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      {grade.students?.full_name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                        {grade.module}
                      </span>
                    </div>
                    <p className="text-white/20 text-xs mt-1">{formatDate(grade.created_at)}</p>
                  </div>

                  <div className="text-center shrink-0">
                    <p className={`text-2xl font-black ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </p>
                    <p className="text-white/30 text-xs">/20</p>
                  </div>

                  <button
                    onClick={() => handleDelete(grade.id)}
                    className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

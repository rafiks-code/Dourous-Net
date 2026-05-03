'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, CheckCircle2, FileText, Loader2, AlertCircle, 
  User, ClipboardList, Send, Upload, Plus, X 
} from 'lucide-react'
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
  const fileRef = useRef<HTMLInputElement>(null)
  
  // States for student copies
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ grade: '', comment: '', pdfUrl: '' })

  // States for general corrections
  const [corrections, setCorrections] = useState<any[]>([])
  const [loadingCorrections, setLoadingCorrections] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [generalForm, setGeneralForm] = useState({
    title: '',
    subject: '',
    level: '',
    filiere: '',
    file: null as File | null,
  })

  const LEVELS = ['1AS', '2AS', '3AS']
  const FILIERES: Record<string, string[]> = {
    '1AS': ['TC Sciences', 'TC Lettres'],
    '2AS': ['Sciences Expérimentales', 'Mathématiques', 'Lettres et Philosophie', 'Langues Étrangères'],
    '3AS': ['Sciences Expérimentales', 'Mathématiques', 'Technique Mathématique', 'Lettres et Philosophie', 'Langues Étrangères', 'Gestion et Économie'],
  }

  const loadSubmissions = useCallback(async () => {
    setLoadingSubmissions(true)
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
    setLoadingSubmissions(false)
  }, [supabase])

  const loadCorrections = useCallback(async () => {
    setLoadingCorrections(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('corrections')
        .select('*')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false })

      setCorrections(data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCorrections(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSubmissions()
    loadCorrections()
  }, [loadSubmissions, loadCorrections])

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
          professor_id: user?.id, // Using professor_id to match new schema
          pdf_url: form.pdfUrl,    // Using pdf_url to match new schema
          title: `Correction: ${selectedSub.homework.title} - ${selectedSub.student.full_name}`,
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
      await loadCorrections()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Correction error:', err)
      alert(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generalForm.file || !generalForm.title) return
    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upload PDF to storage
      const fileName = `${user.id}_${Date.now()}_${generalForm.file.name}`
      const { error: uploadError } = await supabase.storage
        .from('corrections')
        .upload(fileName, generalForm.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('corrections')
        .getPublicUrl(fileName)

      // Save to corrections table
      const { error: insertError } = await supabase
        .from('corrections')
        .insert({
          professor_id: user.id,
          title: generalForm.title,
          subject: generalForm.subject,
          level: generalForm.level,
          filiere: generalForm.filiere,
          pdf_url: urlData.publicUrl,
        })

      if (insertError) throw insertError

      setSuccessMsg('Correction publiée avec succès!')
      setGeneralForm({ title: '', subject: '', level: '', filiere: '', file: null })
      setShowForm(false)
      loadCorrections()
      setTimeout(() => setSuccessMsg(''), 3000)

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-10 animate-fade-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            {t('correctionsTitle')}
          </h1>
          <p className="text-white/50 mt-2">
            Gérez les copies et publiez des corrections générales
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl
            bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40
            transition-all font-bold border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Annuler' : 'Ajouter une correction PDF'}
        </button>
      </header>

      {/* General Success Msg */}
      {successMsg && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20
          rounded-xl p-4 flex items-center gap-3 animate-scale-in">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Upload Form (General Corrections) */}
      {showForm && (
        <div className="glass-card p-8 mb-12 border-indigo-500/30 animate-fade-slide-up">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-400" />
            Nouvelle correction PDF (Générale)
          </h2>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Titre de la correction</Label>
                <input
                  type="text"
                  required
                  value={generalForm.title}
                  onChange={e => setGeneralForm({...generalForm, title: e.target.value})}
                  placeholder="Ex: Correction Devoir 1 - Maths"
                  className="w-full bg-white/5 border border-white/10 rounded-xl
                    px-4 py-3 text-white placeholder-white/30 text-sm
                    focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label>Matière</Label>
                <input
                  type="text"
                  value={generalForm.subject}
                  onChange={e => setGeneralForm({...generalForm, subject: e.target.value})}
                  placeholder="Ex: Mathématiques"
                  className="w-full bg-white/5 border border-white/10 rounded-xl
                    px-4 py-3 text-white placeholder-white/30 text-sm
                    focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Niveau (Optionnel)</Label>
                <select
                  value={generalForm.level}
                  onChange={e => setGeneralForm({...generalForm, level: e.target.value, filiere: ''})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl
                    px-4 py-3 text-white text-sm
                    focus:outline-none focus:border-indigo-500/50 transition-all">
                  <option value="" className="bg-[#0a0a1a]">Tous les niveaux</option>
                  {LEVELS.map(l => (
                    <option key={l} value={l} className="bg-[#0a0a1a]">{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Filière (Optionnel)</Label>
                <select
                  value={generalForm.filiere}
                  onChange={e => setGeneralForm({...generalForm, filiere: e.target.value})}
                  disabled={!generalForm.level}
                  className="w-full bg-white/5 border border-white/10 rounded-xl
                    px-4 py-3 text-white text-sm
                    focus:outline-none focus:border-indigo-500/50 transition-all
                    disabled:opacity-40">
                  <option value="" className="bg-[#0a0a1a]">Toutes les filières</option>
                  {generalForm.level && FILIERES[generalForm.level]?.map(f => (
                    <option key={f} value={f} className="bg-[#0a0a1a]">{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl
                p-12 text-center cursor-pointer hover:border-indigo-500/50
                transition-all group bg-white/5 hover:bg-white/8">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => setGeneralForm({...generalForm, file: e.target.files?.[0] || null})}
              />
              {generalForm.file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-lg">{generalForm.file.name}</p>
                    <p className="text-white/40 text-sm">
                      {(generalForm.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-500/10 transition-colors">
                    <Upload className="w-8 h-8 text-white/20 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-white font-bold">Cliquez pour choisir un PDF</p>
                  <p className="text-white/20 text-sm mt-1">PDF uniquement, max 10MB</p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20
                rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !generalForm.file || !generalForm.title}
              className="w-full py-4 rounded-xl font-black text-lg text-white
                bg-gradient-to-r from-indigo-600 to-purple-600
                hover:from-indigo-500 hover:to-purple-500
                transition-all flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20">
              {uploading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Publication en cours...</>
              ) : (
                <><Upload className="w-6 h-6" /> Publier la correction</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Mes corrections publiées */}
      <div className="mb-12 animate-fade-slide-up stagger-1">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <FileText className="w-6 h-6 text-indigo-400" />
          Mes corrections publiées
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
            {corrections.length}
          </span>
        </h2>

        {loadingCorrections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-20 skeleton" />
            ))}
          </div>
        ) : corrections.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-white/5">
            <CheckCircle className="w-12 h-12 text-white/5 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucune correction générale publiée pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corrections.map(correction => (
              <div key={correction.id}
                className="glass-card p-5 flex items-center gap-4
                  hover:border-indigo-500/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10
                  flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate text-sm">
                    {correction.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {correction.subject && (
                      <span className="text-[10px] bg-white/5 text-white/50
                        px-2 py-0.5 rounded-md border border-white/5">
                        {correction.subject}
                      </span>
                    )}
                    {correction.level && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300
                        px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {correction.level}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={correction.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  title="Voir PDF"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-white/5 mb-12" />

      {/* Copies à corriger Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4 animate-fade-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              {t('copiesToCorrect')}
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              {submissions.length}
            </span>
          </div>

          {loadingSubmissions ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-24 skeleton" />
            ))
          ) : submissions.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-white/5">
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

        <div className="lg:col-span-7 animate-fade-slide-up stagger-3">
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
              <p className="text-sm text-white/20 max-w-xs">Sélectionnez une copie pour commencer la correction individuelle.</p>
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

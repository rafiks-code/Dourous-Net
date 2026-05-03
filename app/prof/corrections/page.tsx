'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, CheckCircle2, FileText, Loader2, AlertCircle, 
  User, ClipboardList, Send, Upload, Plus, X, Trash2, Calendar
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
          professor_id: user?.id,
          pdf_url: form.pdfUrl,
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
      loadCorrections()
      setTimeout(() => setSuccessMsg(''), 3000)

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, pdfUrl: string) => {
    if (!confirm(t('deleteConfirm'))) return
    try {
      const fileName = pdfUrl.split('/').pop()
      if (fileName) {
        await supabase.storage.from('corrections').remove([fileName])
      }
      const { error } = await supabase
        .from('corrections')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadCorrections()
    } catch (err) {
      console.error(err)
      alert(t('error'))
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-10 animate-fade-slide-up">
        <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          {t('correctionsTitle')}
        </h1>
        <p className="text-white/50 mt-2">
          Publiez et gérez les corrections PDF pour vos étudiants
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Form */}
        <div className="lg:col-span-5 animate-fade-slide-up stagger-1">
          <div className="glass-card p-8 border-emerald-500/20 border sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Nouvelle correction...
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label>Titre de la correction</Label>
                <Input
                  required
                  value={generalForm.title}
                  onChange={e => setGeneralForm({...generalForm, title: e.target.value})}
                  placeholder="Titre de la correction..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Matière</Label>
                <Input
                  required
                  value={generalForm.subject}
                  onChange={e => setGeneralForm({...generalForm, subject: e.target.value})}
                  placeholder="Ex: Mathématiques, Français..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <select
                    value={generalForm.level}
                    onChange={e => setGeneralForm({...generalForm, level: e.target.value, filiere: ''})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="" className="bg-[#0a0a1a]">Choisir...</option>
                    {LEVELS.map(l => <option key={l} value={l} className="bg-[#0a0a1a]">{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Filière</Label>
                  <select
                    value={generalForm.filiere}
                    onChange={e => setGeneralForm({...generalForm, filiere: e.target.value})}
                    disabled={!generalForm.level}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-40"
                  >
                    <option value="" className="bg-[#0a0a1a]">Choisir...</option>
                    {generalForm.level && FILIERES[generalForm.level]?.map(f => (
                      <option key={f} value={f} className="bg-[#0a0a1a]">{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fichier PDF</Label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-all group bg-white/5 hover:bg-white/8"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => setGeneralForm({...generalForm, file: e.target.files?.[0] || null})}
                  />
                  {generalForm.file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-400" />
                      <span className="text-white font-medium truncate max-w-[200px]">
                        {generalForm.file.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-white/20 group-hover:text-emerald-400 transition-colors" />
                      <p className="text-sm text-white/40">Cliquez pour choisir un PDF</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-scale-in">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full py-6 font-bold text-lg shadow-lg shadow-emerald-500/20 from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                disabled={uploading || !generalForm.file || !generalForm.title}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Publier la correction"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right column: List */}
        <div className="lg:col-span-7 space-y-4 animate-fade-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Corrections</h2>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
              {corrections.length}
            </span>
          </div>

          {loadingCorrections ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-32 skeleton" />
            ))
          ) : corrections.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="w-16 h-16 text-white/10 mx-auto mb-4 animate-float" />
              <p className="text-white/40">Aucune correction publiée</p>
            </div>
          ) : (
            corrections.map((correction, index) => (
              <div
                key={correction.id}
                className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-emerald-500/40 transition-all duration-300 animate-fade-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        {correction.subject || 'Général'}
                      </span>
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(correction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {correction.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-1">
                      {correction.level} {correction.filiere && `• ${correction.filiere}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <a
                    href={correction.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none"
                  >
                    <Button variant="secondary" size="sm" className="w-full gap-2 hover:bg-white/10">
                      <FileText className="w-4 h-4" />
                      Voir le PDF
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => handleDelete(correction.id, correction.pdf_url)}
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

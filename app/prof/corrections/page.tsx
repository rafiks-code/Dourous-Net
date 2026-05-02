'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import PDFUpload from '@/components/PDFUpload'

export default function ProfCorrectionsPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  
  const [grade, setGrade] = useState('')
  const [comment, setComment] = useState('')
  const [correctionUrl, setCorrectionUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  async function fetchSubmissions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('submissions')
      .select(`
        id, content, file_url, submitted_at, homework_id, student_id,
        students ( full_name, level, filiere ),
        homework!inner ( id, title, prof_id, subject )
      `)
      .eq('homework.prof_id', user.id)
      .eq('status', 'soumis')
      .order('submitted_at', { ascending: false })

    if (data) setSubmissions(data)
    setLoading(false)
  }

  const saveCorrection = async () => {
    if (!selectedSubmission || !grade) {
      alert(language === 'ar' ? 'أدخل الدرجة' : 'Veuillez entrer une note')
      return
    }
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Update submission
      const { error: subError } = await supabase
        .from('submissions')
        .update({ 
          status: 'corrigé',
          correction_url: correctionUrl || null
        })
        .eq('id', selectedSubmission.id)

      if (subError) throw subError

      // Add grade
      const { error: gradeError } = await supabase
        .from('grades')
        .insert({
          student_id: selectedSubmission.student_id,
          prof_id: user?.id,
          subject: selectedSubmission.homework?.subject || '',
          grade: parseFloat(grade),
          comment: comment || '',
        })

      if (gradeError) throw gradeError

      // Send notification
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.student_id,
        message: language === 'ar' 
          ? `تم تصحيح واجبك "${selectedSubmission.homework?.title}". الدرجة: ${grade}/20`
          : `Votre devoir "${selectedSubmission.homework?.title}" a été corrigé. Note: ${grade}/20`,
        type: 'grade',
        is_read: false,
      })

      // Refresh list
      await fetchSubmissions()
      
      // Reset
      setSelectedSubmission(null)
      setGrade('')
      setComment('')
      setCorrectionUrl('')

      alert(language === 'ar' ? 'تم الحفظ بنجاح!' : 'Correction enregistrée avec succès!')

    } catch (error: any) {
      console.error('Error:', error)
      alert('Erreur: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container max-w-5xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            {t('correction')}
          </h1>
          <p className="text-white/50 mt-1">{t('evaluateHomeworks')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : submissions.length === 0 ? (
        <div className="glass-card p-16 text-center text-white/50">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500/20" />
          <p>{t('noPendingCorrections')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-white/70 px-2">{t('toCorrect')} ({submissions.length})</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {submissions.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedSubmission?.id === sub.id 
                      ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <p className="font-bold mb-1 truncate">{sub.students?.full_name}</p>
                  <p className="text-xs opacity-70 mb-2 truncate">Devoir: {sub.homework?.title}</p>
                  <p className="text-[10px] opacity-50 flex items-center gap-1">
                    Soumis le {formatDate(sub.submitted_at)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="glass-card p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-bold">{selectedSubmission.students?.full_name}</h2>
                    <p className="text-sm text-white/50">{selectedSubmission.students?.level} • {selectedSubmission.students?.filiere}</p>
                  </div>
                </div>

                {/* View student submission */}
                {(selectedSubmission?.file_url || selectedSubmission?.content) && (
                  <div className="mb-4">
                    <p className="text-sm text-indigo-300 mb-2">
                      {language === 'ar' ? 'عمل الطالب:' : 'Travail de l élève:'}
                    </p>
                    <a 
                      href={selectedSubmission.file_url || selectedSubmission.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm w-fit transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {language === 'ar' ? 'فتح ملف الطالب' : 'Ouvrir le PDF du élève'}
                    </a>
                  </div>
                )}

                {/* Upload correction PDF */}
                <div className="mb-4">
                  <p className="text-sm text-indigo-300 mb-2">
                    {language === 'ar' ? 'رفع ملف التصحيح (اختياري)' : 'Télécharger le corrigé PDF (optionnel)'}
                  </p>
                  <PDFUpload 
                    bucket="corrections"
                    onUpload={(url) => setCorrectionUrl(url)}
                    language={language}
                  />
                  {correctionUrl && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      ✅ {language === 'ar' ? 'تم رفع التصحيح' : 'Corrigé téléchargé'}
                    </p>
                  )}
                </div>

                {/* Grade input */}
                <div className="mb-4">
                  <label className="text-sm text-indigo-300 mb-2 block">
                    {language === 'ar' ? 'الدرجة / 20' : 'Note / 20'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="0 - 20"
                    className="w-full px-4 py-2 bg-indigo-900/30 border border-indigo-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="text-sm text-indigo-300 mb-2 block">
                    {language === 'ar' ? 'تعليق' : 'Commentaire'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={language === 'ar' ? 'تعليق...' : 'Commentaire...'}
                    rows={3}
                    className="w-full px-4 py-2 bg-indigo-900/30 border border-indigo-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={saveCorrection}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {language === 'ar' ? 'تصحيح' : 'Corriger'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] glass-card flex flex-col items-center justify-center text-white/30 p-8 text-center">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>{t('selectCopyToCorrect')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

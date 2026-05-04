'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { CheckCircle, FileText, Loader2, Calendar, Download, Eye, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function StudentCorrectionsPage() {
  const { language, t } = useLanguage()
  const isAr = language === 'ar'
  const [corrections, setCorrections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get student info
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()

        setStudentInfo(student)

        // Get all corrections
        const { data } = await supabase
          .from('corrections')
          .select('*')
          .order('created_at', { ascending: false })

        // Filter corrections matching student's level/filiere
        const filtered = (data ?? []).filter(c => {
          if (!c.level && !c.filiere) return true
          if (c.level === student?.level && !c.filiere) return true
          if (c.level === student?.level && c.filiere === student?.filiere) return true
          return false
        })

        setCorrections(filtered)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    const date = new Date(dateStr)
    return date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="page-container max-w-6xl mx-auto py-10 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-12">
        <header className="space-y-2 animate-fade-slide-up">
          <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            {t('correctionsTitle')}
          </h1>
          <p className="text-white/50">{t('correctionsSubtitle')}</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-64 skeleton rounded-2xl" />
            ))}
          </div>
        ) : corrections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-slide-up">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 animate-float">
              <CheckCircle className="w-12 h-12 text-emerald-500/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('noCorrections')}</h2>
            <p className="text-white/40">{t('noCorrectionsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {corrections.map((correction, index) => {
              return (
                <div
                  key={correction.id}
                  className="glass-card flex flex-col group hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 animate-fade-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Subject pill */}
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                          {correction.subject || t('general')}
                        </span>
                        {/* Status pill - like "À FAIRE" but "NOUVEAU" */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          {t('new')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/30 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(correction.created_at)}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-300 transition-colors">
                        {correction.title}
                      </h3>
                      <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                        {correction.filiere || t('allStudents')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                      <Button
                        variant="secondary"
                        className="rounded-xl h-11 w-full gap-2 hover:bg-white/10"
                        onClick={() => window.open(correction.pdf_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                        {t('viewCorrection')}
                      </Button>
                      
                      <a 
                        href={correction.pdf_url} 
                        download 
                        className="w-full"
                      >
                        <Button variant="gradient" className="rounded-xl h-11 w-full gap-2 from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25">
                          <Download className="w-4 h-4" />
                          {t('downloadPDF')}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

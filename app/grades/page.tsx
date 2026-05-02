import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Award, Calendar, CheckCircle2, Search, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Notes | Dourous-Net',
  description: 'Consultez vos notes et évaluations',
}

export default async function GradesPage() {
  let user = null
  let student = null
  let grades = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (!user) redirect('/auth/login')

    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()
    student = studentData

    const { data: gradesData } = await supabase
      .from('grades')
      .select(`
        id, subject, grade, comment, created_at,
        professors ( full_name )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
    grades = gradesData
  } catch (error) {
    console.error('Supabase error in grades:', error)
    if (!user) return <div className="p-8 text-center text-white">Erreur de connexion au serveur.</div>
  }

  const gradesList = grades ?? []

  // Calculate average
  const totalGrades = gradesList.reduce((acc, curr) => acc + Number(curr.grade), 0)
  const average = gradesList.length > 0 ? (totalGrades / gradesList.length).toFixed(2) : null

  return (
    <div className="page-container max-w-5xl mx-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-400" />
            Mes Notes
          </h1>
          <p className="text-white/50 mt-2">
            Suivez vos résultats et les appréciations de vos professeurs.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{gradesList.length}</p>
              <p className="text-xs text-white/40">Notes reçues</p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{average ? `${average}/20` : '—'}</p>
              <p className="text-xs text-white/40">Moyenne générale</p>
            </div>
          </div>
        </div>

        {gradesList.length === 0 ? (
          <div className="glass-card p-16 text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucune note</h3>
            <p className="text-white/50 max-w-sm mx-auto">
              Vous n'avez pas encore reçu de notes. Continuez vos efforts !
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
              <div className="col-span-3 sm:col-span-2">Date</div>
              <div className="col-span-4 sm:col-span-3">Matière</div>
              <div className="col-span-3 sm:col-span-2 text-center">Note</div>
              <div className="col-span-12 sm:col-span-5 mt-2 sm:mt-0">Appréciation</div>
            </div>
            <div className="divide-y divide-white/5">
              {gradesList.map((g: any) => {
                const numericGrade = Number(g.grade)
                const gradeColor = numericGrade >= 15 ? 'text-emerald-400' : numericGrade >= 10 ? 'text-blue-400' : 'text-rose-400'
                const bgVariant = numericGrade >= 15 ? 'success' : numericGrade >= 10 ? 'info' : 'destructive'

                return (
                  <div key={g.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-3 sm:col-span-2 flex flex-col gap-1 text-sm text-white/50">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(g.created_at)}</span>
                    </div>
                    <div className="col-span-4 sm:col-span-3 flex flex-col">
                      <span className="font-medium text-white">{g.subject}</span>
                      <span className="text-xs text-white/40">Prof. {g.professors?.full_name}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <Badge variant={bgVariant as any} className={`text-sm px-3 py-1 font-bold ${gradeColor}`}>
                        {g.grade}/20
                      </Badge>
                    </div>
                    <div className="col-span-12 sm:col-span-5 text-sm text-white/70 italic mt-2 sm:mt-0 bg-white/5 p-3 rounded-lg border border-white/5">
                      "{g.comment || 'Aucune appréciation'}"
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

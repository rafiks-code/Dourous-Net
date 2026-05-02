import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, ClipboardList, CheckCircle2, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Dashboard Professeur | Dourous-Net',
  description: 'Espace professeur',
}

export default async function ProfDashboardPage() {
  let user = null
  let prof = null
  let studentsCount = 0
  let lessonsCount = 0
  let pendingHomework = 0
  let recentSubmissions = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (!user) redirect('/auth/login')

    const { data: profData } = await supabase
      .from('professors')
      .select('*')
      .eq('id', user.id)
      .single()
    prof = profData

    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
    studentsCount = sCount || 0

    const { count: lCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('prof_id', user.id)
    lessonsCount = lCount || 0

    const { count: pCount } = await supabase.from('submissions').select('id, homework!inner(prof_id)').eq('homework.prof_id', user.id)
    pendingHomework = pCount || 0
    
    const { data: recent } = await supabase
      .from('submissions')
      .select('id, submitted_at, students(full_name), homework!inner(title)')
      .eq('homework.prof_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(5)
    recentSubmissions = recent
  } catch (error) {
    console.error('Supabase error in prof dashboard:', error)
    if (!user) {
      return <div className="p-8 text-center text-white">Erreur de connexion au serveur.</div>
    }
  }

  return (
    <div className="page-container max-w-6xl mx-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">Bonjour, Prof. {prof?.full_name ?? 'Professeur'}</h1>
          <p className="text-white/50 mt-1">Matière enseignée : {prof?.subject ?? 'Non définie'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-indigo-500">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{studentsCount || 0}</p>
              <p className="text-xs text-white/40">Élèves inscrits</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{lessonsCount || 0}</p>
              <p className="text-xs text-white/40">Cours publiés</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{pendingHomework || 0}</p>
              <p className="text-xs text-white/40">Copies à corriger</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-t-blue-500">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">Actif</p>
              <p className="text-xs text-white/40">Statut du compte</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> 
              Activité récente (Soumissions)
            </h2>
            {recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((sub: any) => (
                  <div key={sub.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sub.students?.full_name}</p>
                      <p className="text-xs text-white/40">Devoir: {sub.homework?.title}</p>
                    </div>
                    <span className="text-[10px] text-white/30 bg-black/20 px-2 py-1 rounded">
                      Nouveau
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 italic">Aucune activité récente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

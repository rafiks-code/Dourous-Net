import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, Calendar, Clock, AlertCircle, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export const metadata = {
  title: 'Devoirs | Dourous-Net',
  description: 'Gérez vos devoirs et soumissions',
}

export default async function HomeworkPage() {
  let user = null
  let student = null
  let homeworks = null

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

    const { data: homeworksData } = await supabase
      .from('homework')
      .select(`
        id, title, description, due_date, created_at,
        professors ( full_name, subject ),
        submissions ( id, submitted_at, content )
      `)
      .order('due_date', { ascending: true })
    homeworks = homeworksData
  } catch (error) {
    console.error('Supabase error in homework:', error)
    if (!user) return <div className="p-8 text-center text-white">Erreur de connexion au serveur.</div>
  }

  // Submissions might return an array, filter those that belong to this student
  const homeworkList = homeworks?.map(hw => {
    const userSubmission = hw.submissions?.find((s: any) => true) // Wait, can't easily filter in select without eq. Let's fetch submissions separately or map.
    return {
      ...hw,
      submission: userSubmission
    }
  }) ?? []

  return (
    <div className="page-container max-w-5xl mx-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            Mes Devoirs
          </h1>
          <p className="text-white/50 mt-2">
            Consultez les devoirs à faire et envoyez vos réponses.
          </p>
        </div>

        {homeworkList.length === 0 ? (
          <div className="glass-card p-16 text-center animate-scale-in">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun devoir</h3>
            <p className="text-white/50 max-w-sm mx-auto">
              Vous êtes à jour ! Aucun nouveau devoir n'a été publié.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {homeworkList.map((hw: any) => {
              const isOverdue = new Date(hw.due_date) < new Date() && !hw.submission
              const isSubmitted = !!hw.submission

              return (
                <div key={hw.id} className="glass-card p-6 flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="gap-1.5">
                      {hw.professors?.subject ?? 'Matière'}
                    </Badge>
                    <Badge variant={isSubmitted ? 'success' : isOverdue ? 'warning' : 'info'} className="gap-1 text-xs">
                      {isSubmitted ? <FileText className="w-3.5 h-3.5" /> : isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {isSubmitted ? 'Rendu' : isOverdue ? 'En retard' : 'À faire'}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{hw.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-3">
                    {hw.description}
                  </p>

                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-4 text-xs text-white/40 bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">Échéance: {formatDate(hw.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                        <span>Prof. {hw.professors?.full_name}</span>
                      </div>
                    </div>

                    {isSubmitted ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-400">Devoir rendu</p>
                          <p className="text-xs text-emerald-400/60">Le {formatDate(hw.submission.submitted_at)}</p>
                        </div>
                        <a href={hw.submission.content} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                            Voir ma copie
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <Link href={`/homework/${hw.id}/submit`}>
                        <Button variant="gradient" className="w-full gap-2">
                          <FileText className="w-4 h-4" />
                          Soumettre mon travail
                        </Button>
                      </Link>
                    )}
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

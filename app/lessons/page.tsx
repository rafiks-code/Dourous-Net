import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Calendar, FileText, Search, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Cours | Dourous-Net',
  description: 'Consultez vos cours en ligne',
}

export default async function LessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch student info
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all lessons (ideally filtered by student's level/filiere, but table just has prof_id)
  // Let's fetch lessons and join with professors to get module name
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id, title, content, created_at,
      professors ( full_name, subject )
    `)
    .order('created_at', { ascending: false })

  const lessonList = lessons ?? []

  return (
    <div className="page-container max-w-5xl mx-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            Mes Cours
          </h1>
          <p className="text-white/50 mt-2">
            Consultez les leçons publiées par vos professeurs.
          </p>
        </div>

        {/* Filters/Search placeholder */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Rechercher un cours..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Lessons Grid */}
        {lessonList.length === 0 ? (
          <div className="glass-card p-16 text-center animate-scale-in">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun cours disponible</h3>
            <p className="text-white/50 max-w-sm mx-auto">
              Vos professeurs n'ont pas encore publié de cours. Revenez plus tard !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessonList.map((lesson: any) => (
              <div key={lesson.id} className="glass-card p-6 flex flex-col group hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="info" className="gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {lesson.professors?.subject ?? 'Matière'}
                  </Badge>
                  <div className="text-xs text-white/40 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(lesson.created_at)}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {lesson.title}
                </h3>
                
                <p className="text-sm text-white/50 mb-6 flex-1 line-clamp-2">
                  Prof. {lesson.professors?.full_name}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                  <a href={lesson.content} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="secondary" className="w-full gap-2">
                      <FileText className="w-4 h-4" />
                      Ouvrir le document
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

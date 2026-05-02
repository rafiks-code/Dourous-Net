import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, Mail, GraduationCap, BookOpen, Calendar, Edit2, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Mon Profil | Dourous-Net',
  description: 'Gérez vos informations personnelles',
}

export default async function ProfilePage() {
  let user = null
  let dbUser = null
  let role = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    
    if (!user) redirect('/auth/login')

    role = user.user_metadata?.role === 'professor' ? 'professor' : 'student'

    if (role === 'professor') {
      const { data } = await supabase.from('professors').select('*').eq('id', user.id).single()
      dbUser = data
    } else {
      const { data } = await supabase.from('students').select('*').eq('id', user.id).single()
      dbUser = data
    }
  } catch (error) {
    console.error('Supabase error in profile:', error)
    if (!user) return <div className="p-8 text-center text-white">Erreur de connexion au serveur.</div>
  }

  const fullName = dbUser?.full_name || user.user_metadata?.full_name || 'Utilisateur'
  const displayRole = role === 'professor' ? 'Professeur' : 'Étudiant'
  const level = dbUser?.level || user.user_metadata?.level || ''
  const filiere = dbUser?.filiere || user.user_metadata?.filiere || ''
  const subject = dbUser?.subject || user.user_metadata?.subject || ''

  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="page-container max-w-4xl mx-auto py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-400" />
            Mon Profil
          </h1>
          <p className="text-white/50 mt-2">
            Consultez et gérez vos informations personnelles.
          </p>
        </div>

        <div className="glass-card overflow-hidden">
          {/* Header Cover */}
          <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-b border-white/5" />
          
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 mb-8">
              <Avatar className="h-28 w-28 border-4 border-[#0a0a1a] shadow-xl shadow-indigo-500/20">
                <AvatarFallback className="text-3xl bg-indigo-500/20 text-indigo-200 font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-black text-white">{fullName}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant={role === 'professor' ? 'success' : 'info'} className="gap-1">
                    {role === 'professor' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                    {displayRole}
                  </Badge>
                  {user.created_at && (
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Membre depuis {formatDate(user.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <Link href="/settings">
                <Button variant="secondary" className="gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <Edit2 className="w-4 h-4" />
                  Modifier le profil
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Informations Générales</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Nom complet</p>
                      <p className="text-sm font-medium text-white">{fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Adresse email</p>
                      <p className="text-sm font-medium text-white">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Informations Académiques</h3>
                
                <div className="space-y-4">
                  {role === 'student' ? (
                    <>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Niveau d'étude</p>
                          <p className="text-sm font-medium text-white">{level || 'Non renseigné'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Filière</p>
                          <p className="text-sm font-medium text-white">{filiere || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Matière enseignée</p>
                        <p className="text-sm font-medium text-white">{subject || 'Non renseigné'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

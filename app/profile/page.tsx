'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, Mail, GraduationCap, BookOpen, Calendar, Edit2, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function ProfilePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const userRole = user.user_metadata?.role === 'professor' 
          ? 'professor' 
          : 'student'
        setRole(userRole)

        if (userRole === 'professor') {
          const { data } = await supabase
            .from('professors')
            .select('*')
            .eq('id', user.id)
            .single()
          setDbUser(data)
        } else {
          const { data } = await supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .single()
          setDbUser(data)
        }
      } catch (error) {
        console.error('Profile error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  const fullName = dbUser?.full_name 
    || user?.user_metadata?.full_name 
    || 'Utilisateur'
  const displayRole = role === 'professor' 
    ? t('professorRole') || 'Professeur'
    : t('student') || 'Étudiant'
  const level = dbUser?.level || user?.user_metadata?.level || ''
  const filiere = dbUser?.filiere || user?.user_metadata?.filiere || ''
  const subject = dbUser?.subject || user?.user_metadata?.subject || ''

  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div 
      className="page-container max-w-4xl mx-auto py-12"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-400" />
            {t('profileTitle')}
          </h1>
          <p className="text-white/50 mt-2">
            {t('manageProfileDesc') || 'Gérez vos informations personnelles'}
          </p>
        </div>

        {/* Main card */}
        <div className="glass-card overflow-hidden">

          {/* Cover header */}
          <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-b border-white/5" />

          <div className="px-8 pb-8">

            {/* Avatar + name + role */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 mb-8">
              <Avatar className="h-28 w-28 border-4 border-[#0a0a1a] shadow-xl shadow-indigo-500/20">
                <AvatarFallback className="text-3xl bg-indigo-500/20 text-indigo-200 font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-black text-white">{fullName}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge 
                    variant={role === 'professor' ? 'success' : 'info'} 
                    className="gap-1"
                  >
                    {role === 'professor' 
                      ? <Shield className="w-3 h-3" /> 
                      : <GraduationCap className="w-3 h-3" />
                    }
                    {displayRole}
                  </Badge>
                  {user?.created_at && (
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t('memberSince')} {formatDate(user.created_at)}
                    </span>
                  )}
                </div>
              </div>

              <Link href="/settings">
                <Button 
                  variant="secondary" 
                  className="gap-2 w-full sm:w-auto mt-4 sm:mt-0"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('editProfile')}
                </Button>
              </Link>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  {t('generalInfo') || 'Informations générales'}
                </h3>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{t('email')}</p>
                    <p className="text-white text-sm font-medium">
                      {user?.email ?? '-'}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    {role === 'professor' 
                      ? <Shield className="w-5 h-5 text-purple-400" />
                      : <GraduationCap className="w-5 h-5 text-purple-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{t('role')}</p>
                    <p className="text-white text-sm font-medium">{displayRole}</p>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  {t('profileInfo') || 'Informations du profil'}
                </h3>

                {/* Student fields */}
                {role === 'student' && level && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">{t('level')}</p>
                      <p className="text-white text-sm font-medium">{level}</p>
                    </div>
                  </div>
                )}

                {role === 'student' && filiere && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">{t('filiere')}</p>
                      <p className="text-white text-sm font-medium">{filiere}</p>
                    </div>
                  </div>
                )}

                {/* Professor field */}
                {role === 'professor' && subject && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">
                        {t('subjectTaught') || 'Matière enseignée'}
                      </p>
                      <p className="text-white text-sm font-medium">{subject}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, GraduationCap, BookOpen, Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function ProfilePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const role = user.user_metadata?.role || 'student'
      const table = role === 'professor' ? 'professors' : 'students'
      
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfileData(data)
      setFullName(data?.full_name || '')
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    const role = user.user_metadata?.role || 'student'
    const table = role === 'professor' ? 'professors' : 'students'

    const { error } = await supabase
      .from(table)
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: t('error') })
    } else {
      setMessage({ type: 'success', text: t('success') })
    }
    setUpdating(false)
  }

  if (loading) {
    return <div className="flex justify-center p-12 text-white/50">{t('loading')}</div>
  }

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const role = user?.user_metadata?.role === 'professor' ? t('profRole') : t('studentRole')

  return (
    <div className="page-container max-w-4xl mx-auto py-10 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-400" />
            {t('profileTitle')}
          </h1>
          <p className="text-white/50 mt-1">{t('editProfile')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column - Card */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass-card p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Avatar className="h-24 w-24 mx-auto mb-6 border-2 border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                <AvatarFallback className="text-3xl bg-indigo-500/20 text-indigo-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-white truncate">{fullName}</h2>
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-wider mt-1">{role}</p>
              
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">{t('memberSince')}</span>
                  <span className="text-white/60">{formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">{t('active')}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-indigo-500/10">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">{t('profileInfo')}</h3>
              <div className="space-y-4">
                {profileData?.level && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{t('level')}</p>
                      <p className="text-sm text-white/70">{profileData.level}</p>
                    </div>
                  </div>
                )}
                {profileData?.filiere && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{t('filiere')}</p>
                      <p className="text-sm text-white/70">{profileData.filiere}</p>
                    </div>
                  </div>
                )}
                {profileData?.subject && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{t('subject')}</p>
                      <p className="text-sm text-white/70">{profileData.subject}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="md:col-span-8">
            <div className="glass-card p-8">
              <form onSubmit={handleUpdate} className="space-y-6">
                {message.text && (
                  <div className={cn(
                    "p-4 rounded-xl text-sm border animate-in fade-in slide-in-from-top-1",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('fullName')}</Label>
                    <div className="relative group">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", language === 'ar' ? "right-3" : "left-3")} />
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className={cn("bg-white/5 border-white/10", language === 'ar' ? "pr-10" : "pl-10")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                    <Label htmlFor="email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30", language === 'ar' ? "right-3" : "left-3")} />
                      <Input 
                        id="email" 
                        value={user.email} 
                        disabled 
                        className={cn("bg-white/5 border-white/10 cursor-not-allowed", language === 'ar' ? "pr-10" : "pl-10")}
                      />
                    </div>
                    <p className="text-[10px] text-white/30 italic">{t('settings')}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="gradient" disabled={updating} className="px-8 font-bold">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {t('save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

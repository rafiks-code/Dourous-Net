'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, Trash2, AlertCircle, CheckCircle2, Loader2, Save, LogOut } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { LEVELS, FILIERES_BY_LEVEL, type Level, type Filiere, MODULE_ICONS, FILIERE_ARABIC } from '@/lib/constants'

export default function SettingsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [role, setRole] = useState<'student' | 'professor' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Forms states
  const [profileForm, setProfileForm] = useState({ fullName: '', level: '', filiere: '', subject: '', loading: false, success: '', error: '' })
  const [emailForm, setEmailForm] = useState({ email: '', loading: false, success: '', error: '' })
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '', loading: false, success: '', error: '' })
  const [deleteForm, setDeleteForm] = useState({ confirmText: '', loading: false, error: '' })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      const userRole = user.user_metadata?.role === 'professor' ? 'professor' : 'student'
      setRole(userRole)

      if (userRole === 'professor') {
        const { data } = await supabase.from('professors').select('*').eq('id', user.id).single()
        setDbUser(data)
        setProfileForm(prev => ({ ...prev, fullName: data?.full_name || user.user_metadata?.full_name || '', subject: data?.subject || '' }))
      } else {
        const { data } = await supabase.from('students').select('*').eq('id', user.id).single()
        setDbUser(data)
        setProfileForm(prev => ({ ...prev, fullName: data?.full_name || user.user_metadata?.full_name || '', level: data?.level || '', filiere: data?.filiere || '' }))
      }

      setEmailForm(prev => ({ ...prev, email: user.email || '' }))
      setIsLoading(false)
    }
    fetchUser()
  }, [router, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profileForm.fullName, level: profileForm.level, filiere: profileForm.filiere, subject: profileForm.subject }
      })
      if (authError) throw authError

      if (role === 'professor') {
        const { error: dbError } = await supabase.from('professors').update({ full_name: profileForm.fullName, subject: profileForm.subject }).eq('id', user.id)
        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase.from('students').update({ full_name: profileForm.fullName, level: profileForm.level, filiere: profileForm.filiere }).eq('id', user.id)
        if (dbError) throw dbError
      }

      setProfileForm(prev => ({ ...prev, loading: false, success: t('profileUpdated') }))
      setTimeout(() => setProfileForm(prev => ({ ...prev, success: '' })), 3000)
    } catch (err: Error | unknown) {
      setProfileForm(prev => ({ ...prev, loading: false, error: t('errorOccurred') }))
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    try {
      const { error } = await supabase.auth.updateUser({ email: emailForm.email })
      if (error) throw error

      setEmailForm(prev => ({ ...prev, loading: false, success: t('success') }))
    } catch (err: Error | unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setEmailForm(prev => ({ ...prev, loading: false, error: t('errorOccurred') }))
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordForm(prev => ({ ...prev, loading: false, error: t('passwordTooShort') }))
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm(prev => ({ ...prev, loading: false, error: t('passwordsNotMatch') }))
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error

      setPasswordForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '', loading: false, success: t('success') }))
      setTimeout(() => setPasswordForm(prev => ({ ...prev, success: '' })), 3000)
    } catch (err: Error | unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setPasswordForm(prev => ({ ...prev, loading: false, error: t('errorOccurred') }))
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteForm(prev => ({ ...prev, loading: true, error: '' }))

    if (deleteForm.confirmText !== t('deleteConfirmWord')) {
      setDeleteForm(prev => ({ ...prev, loading: false, error: t('errorOccurred') }))
      return
    }

    try {
      const table = role === 'professor' ? 'professors' : 'students'
      await supabase.from(table).delete().eq('id', user.id)
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: Error | unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setDeleteForm(prev => ({ ...prev, loading: false, error: t('errorOccurred') }))
    }
  }

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-4xl mx-auto py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">{t('accountSettings')}</h1>
          <p className="text-white/50 mt-2">{t('manageAccountInfo')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Change Name Section */}
          <div className="glass-card p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              {t('personalInfo')}
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input 
                  id="fullName" 
                  value={profileForm.fullName} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              {role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'المستوى' : 'Niveau'}</Label>
                    <select value={profileForm.level} onChange={e => setProfileForm({...profileForm, level: e.target.value, filiere: ''})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="" className="bg-[#07071a]">{language === 'ar' ? 'اختر المستوى' : 'Choisir'}</option>
                      {LEVELS.map(l => <option key={l} value={l} className="bg-[#07071a]">{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'الشعبة' : 'Filière'}</Label>
                    <select value={profileForm.filiere} onChange={e => setProfileForm({...profileForm, filiere: e.target.value})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={!profileForm.level}>
                      <option value="" className="bg-[#07071a]">{language === 'ar' ? 'اختر الشعبة' : 'Choisir'}</option>
                      {profileForm.level && FILIERES_BY_LEVEL[profileForm.level as Level].map(f => <option key={f} value={f} className="bg-[#07071a]">{language === 'ar' ? (FILIERE_ARABIC[f as Filiere] || f) : f}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {role === 'professor' && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المادة المدرَّسة' : 'Matière enseignée'}</Label>
                  <select value={profileForm.subject} onChange={e => setProfileForm({...profileForm, subject: e.target.value})} className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    <option value="" className="bg-[#07071a]">{language === 'ar' ? 'اختر المادة' : 'Sélectionner'}</option>
                    {Object.keys(MODULE_ICONS).map(m => <option key={m} value={m} className="bg-[#07071a]">{m}</option>)}
                  </select>
                </div>
              )}
              
              {profileForm.error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {profileForm.error}
                </div>
              )}
              {profileForm.success && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {profileForm.success}
                </div>
              )}
              
              <Button type="submit" variant="secondary" className="w-full" disabled={profileForm.loading}>
                {profileForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </form>
          </div>

          {/* Change Email Section */}
          <div className="glass-card p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              {t('changeEmail')}
            </h2>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={emailForm.email} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              {emailForm.error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {emailForm.error}
                </div>
              )}
              {emailForm.success && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {emailForm.success}
                </div>
              )}
              
              <Button type="submit" variant="secondary" className="w-full" disabled={emailForm.loading || emailForm.email === user.email}>
                {emailForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="glass-card p-6 h-fit md:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              {t('changePassword')}
            </h2>
            <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwordForm.newPassword} 
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={passwordForm.confirmPassword} 
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                {passwordForm.error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {passwordForm.error}
                  </div>
                )}
                {passwordForm.success && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mb-4">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {passwordForm.success}
                  </div>
                )}
                
                <Button type="submit" variant="secondary" disabled={passwordForm.loading}>
                  {passwordForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('save')}
                </Button>
              </div>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="glass-card p-6 h-fit md:col-span-2 border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              {t('dangerZone')}
            </h2>
            <p className="text-sm text-white/50 mb-6">
              {t('deleteAccountWarning')}
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmDelete" className="text-red-400/80">
                  {t('typeDeleteToConfirm')}
                </Label>
                <Input 
                  id="confirmDelete" 
                  value={deleteForm.confirmText} 
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                  className="border-red-500/30 focus:border-red-500 focus:ring-red-500"
                  placeholder={t('deleteConfirmWord')}
                />
              </div>
              
              {deleteForm.error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {deleteForm.error}
                </div>
              )}
              
              <Button type="submit" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" disabled={deleteForm.loading || deleteForm.confirmText !== t('deleteConfirmWord')}>
                {deleteForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {t('deleteAccountPermanently')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

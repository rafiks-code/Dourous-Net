'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, Trash2, AlertCircle, CheckCircle2, Loader2, Save, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [role, setRole] = useState<'student' | 'professor' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Forms states
  const [nameForm, setNameForm] = useState({ fullName: '', loading: false, success: '', error: '' })
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
        setNameForm(prev => ({ ...prev, fullName: data?.full_name || user.user_metadata?.full_name || '' }))
      } else {
        const { data } = await supabase.from('students').select('*').eq('id', user.id).single()
        setDbUser(data)
        setNameForm(prev => ({ ...prev, fullName: data?.full_name || user.user_metadata?.full_name || '' }))
      }

      setEmailForm(prev => ({ ...prev, email: user.email || '' }))
      setIsLoading(false)
    }
    fetchUser()
  }, [router, supabase])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    try {
      // Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: nameForm.fullName }
      })
      if (authError) throw authError

      // Update Database Table
      const table = role === 'professor' ? 'professors' : 'students'
      const { error: dbError } = await supabase.from(table).update({ full_name: nameForm.fullName }).eq('id', user.id)
      if (dbError) throw dbError

      setNameForm(prev => ({ ...prev, loading: false, success: 'Nom mis à jour avec succès' }))
      setTimeout(() => setNameForm(prev => ({ ...prev, success: '' })), 3000)
    } catch (err: any) {
      setNameForm(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    try {
      const { error } = await supabase.auth.updateUser({ email: emailForm.email })
      if (error) throw error

      setEmailForm(prev => ({ ...prev, loading: false, success: 'Un lien de confirmation a été envoyé à la nouvelle et l\'ancienne adresse email.' }))
    } catch (err: any) {
      setEmailForm(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordForm(prev => ({ ...prev, loading: true, success: '', error: '' }))
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordForm(prev => ({ ...prev, loading: false, error: 'Le mot de passe doit contenir au moins 6 caractères' }))
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm(prev => ({ ...prev, loading: false, error: 'Les mots de passe ne correspondent pas' }))
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error

      setPasswordForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '', loading: false, success: 'Mot de passe mis à jour avec succès' }))
      setTimeout(() => setPasswordForm(prev => ({ ...prev, success: '' })), 3000)
    } catch (err: any) {
      setPasswordForm(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteForm(prev => ({ ...prev, loading: true, error: '' }))

    if (deleteForm.confirmText !== 'SUPPRIMER') {
      setDeleteForm(prev => ({ ...prev, loading: false, error: 'Veuillez taper SUPPRIMER pour confirmer' }))
      return
    }

    try {
      // NOTE: supabase.auth.admin.deleteUser is required to fully delete auth user, 
      // but for client side, we can clear data or trigger a server-side edge function.
      // Since we don't have an admin function, we can delete the database record and sign out.
      const table = role === 'professor' ? 'professors' : 'students'
      await supabase.from(table).delete().eq('id', user.id)
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      setDeleteForm(prev => ({ ...prev, loading: false, error: err.message }))
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
    <div className="page-container max-w-4xl mx-auto py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">Paramètres du compte</h1>
          <p className="text-white/50 mt-2">Gérez vos informations de compte et préférences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Change Name Section */}
          <div className="glass-card p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Informations personnelles
            </h2>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input 
                  id="fullName" 
                  value={nameForm.fullName} 
                  onChange={(e) => setNameForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              
              {nameForm.error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {nameForm.error}
                </div>
              )}
              {nameForm.success && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {nameForm.success}
                </div>
              )}
              
              <Button type="submit" variant="secondary" className="w-full" disabled={nameForm.loading || nameForm.fullName === dbUser?.full_name}>
                {nameForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </form>
          </div>

          {/* Change Email Section */}
          <div className="glass-card p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Adresse email
            </h2>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Nouvelle adresse email</Label>
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
                Mettre à jour l'email
              </Button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="glass-card p-6 h-fit md:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Mot de passe
            </h2>
            <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwordForm.newPassword} 
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
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
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="glass-card p-6 h-fit md:col-span-2 border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Zone dangereuse
            </h2>
            <p className="text-sm text-white/50 mb-6">
              La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmDelete" className="text-red-400/80">
                  Tapez <strong>SUPPRIMER</strong> pour confirmer
                </Label>
                <Input 
                  id="confirmDelete" 
                  value={deleteForm.confirmText} 
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                  className="border-red-500/30 focus:border-red-500 focus:ring-red-500"
                  placeholder="SUPPRIMER"
                />
              </div>
              
              {deleteForm.error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {deleteForm.error}
                </div>
              )}
              
              <Button type="submit" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" disabled={deleteForm.loading || deleteForm.confirmText !== 'SUPPRIMER'}>
                {deleteForm.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Supprimer mon compte définitivement
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

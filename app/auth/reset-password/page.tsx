'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, CheckCircle2, AlertCircle, EyeOff, Eye } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      // User is automatically signed in by the token in the URL hash, so we can just updateUser
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (resetError) throw resetError
      
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch (err: any) {
      setError(err.message || 'Le lien de réinitialisation est invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md w-full animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mot de passe modifié !</h2>
          <p className="text-white/50 text-sm mb-6">
            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers votre espace...
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full">
              Aller au Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-700/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text">Nouveau mot de passe</h1>
          <p className="text-white/50 mt-2 text-sm">
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </p>
        </div>
        
        <div className="glass-card p-8 animate-scale-in">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Min. 6 caractères" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pr-10" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" 
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full mt-2" 
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enregistrement...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> Réinitialiser</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

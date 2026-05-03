'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPasswordChanged = searchParams.get('success') === 'password_changed'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(t('invalidCredentials'))
      setLoading(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role
      router.push(role === 'professor' ? '/prof/dashboard' : '/modules')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md space-y-8 glass-card p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <div className="text-center relative">
          <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black gradient-text">Dourous-Net</h1>
          <p className="text-white/50 mt-2">{t('signIn')}</p>
        </div>

        {isPasswordChanged && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3 animate-scale-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p>{t('passwordChanged')}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative group">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", isAr ? "right-3" : "left-3")} />
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                className={isAr ? "pr-10" : "pl-10"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative group">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", isAr ? "right-3" : "left-3")} />
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                className={isAr ? "pr-10" : "pl-10"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-6 font-bold"
            variant="gradient"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login')}
          </Button>

          <p className="text-center text-sm text-white/50">
            {t('noAccount')}{' '}
            <Link
              href="/auth/register"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline underline-offset-4"
            >
              {t('signUp')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

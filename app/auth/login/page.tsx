'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Mail, Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPasswordChanged = searchParams.get('success') === 'password_changed'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
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
    <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center px-4 py-12" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header section consistent with Register */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{t('signIn')}</h1>
        <p className="text-white/40 text-sm">Bienvenue sur Dourous-Net</p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-[#0f0f1a] border border-white/5 rounded-3xl p-8 shadow-2xl">

          {isPasswordChanged && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>{t('passwordChanged')}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">{t('email')}</Label>
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/5 border-transparent rounded-xl focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-sm">{t('password')}</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {t('forgotPassword')} ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white/5 border-transparent rounded-xl focus:border-indigo-500 pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('login')}
            </Button>

            <p className="text-center text-sm text-white/40 pt-2">
              {t('noAccount')}{' '}
              <Link
                href="/auth/register"
                className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
              >
                {t('signUp')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

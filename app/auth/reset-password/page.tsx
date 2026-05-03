'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import {
  Lock, Eye, EyeOff,
  CheckCircle, AlertCircle,
  Loader2, Key, Check, X
} from 'lucide-react'

export default function ResetPasswordPage() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'waiting' | 'idle' | 'loading' | 'success' | 'error'>('waiting')
  const [errorMsg, setErrorMsg] = useState('')

  // PASSWORD STRENGTH
  const getStrength = (pass: string) => {
    if (pass.length === 0) 
      return { level: 0, label: '', color: '' }
    if (pass.length < 6)   
      return { level: 1, label: t('tooShort'), color: 'bg-red-500' }
    if (pass.length < 8)   
      return { level: 2, label: t('weak'), color: 'bg-orange-500' }
    if (!/[0-9]/.test(pass) || !/[a-zA-Z]/.test(pass))
      return { level: 2, label: t('weak'), color: 'bg-orange-500' }
    if (!/[^a-zA-Z0-9]/.test(pass))
      return { level: 3, label: t('medium'), color: 'bg-yellow-500' }
    return { level: 4, label: t('strong'), color: 'bg-green-500' }
  }
  const strength = getStrength(password)
  const passwordsMatch = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm

  const [ready, setReady] = useState(false)

  // CHECK VERIFICATION ON MOUNT
  useEffect(() => {
    const verified = sessionStorage.getItem('reset_verified')
    const email = sessionStorage.getItem('reset_email')
    if (!verified || !email) {
      router.push('/auth/forgot-password')
      return
    }
    setReady(true)
    setStatus('idle')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setErrorMsg(t('passwordTooShort'))
      setStatus('error')
      return
    }
    if (password !== confirm) {
      setErrorMsg(t('passwordsNotMatch'))
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    const email = sessionStorage.getItem('reset_email')

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || t('error'))
      } else {
        setStatus('success')
        // Clear session storage
        sessionStorage.removeItem('reset_email')
        sessionStorage.removeItem('reset_verified')
        // Redirect to login
        setTimeout(() => {
          router.push('/auth/login?success=password_changed')
        }, 2500)
      }
    } catch (err) {
      console.error('Reset error:', err)
      setStatus('error')
      setErrorMsg(t('error'))
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2
          -translate-y-1/2 w-[500px] h-[500px]
          bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10
          rounded-2xl p-8 shadow-2xl animate-fade-in">

          {/* WAITING STATE - session not ready yet */}
          {status === 'waiting' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-indigo-400
                animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">
                {t('waitingLink')}
              </p>
              <p className="text-white/20 text-xs mt-2">
                {t('waitingLinkHint')}
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 bg-green-500/20 rounded-full
                flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t('passwordUpdated')}
              </h2>
              <p className="text-white/50 text-sm">
                {t('redirecting')}
                <span className="inline-flex gap-1 ml-1">
                  <span className="animate-bounce delay-0">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </p>
            </div>
          )}

          {/* FORM STATE */}
          {(status === 'idle' || 
            status === 'loading' || 
            status === 'error') && (
            <>
              {/* Icon */}
              <div className="w-16 h-16 bg-purple-500/20 rounded-full
                flex items-center justify-center mx-auto mb-6">
                <Key className="w-8 h-8 text-purple-400" />
              </div>

              <h1 className="text-2xl font-black gradient-text text-center">
                {t('newPassword')}
              </h1>
              <p className="text-white/40 text-sm text-center mt-2 mb-8">
                {t('newPasswordSub')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* New password input */}
                <div>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-5 h-5",
                      "text-white/30 transition-colors",
                      "group-focus-within:text-purple-400",
                      isAr ? "right-3" : "left-3"
                    )} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t('newPassword')}
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl",
                        "text-white placeholder-white/20 text-sm py-3",
                        "focus:outline-none focus:border-purple-500/50",
                        "transition-all duration-300",
                        isAr ? "pr-11 pl-11 text-right" : "pl-11 pr-11"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2",
                        "text-white/30 hover:text-white/60",
                        "transition-colors",
                        isAr ? "left-3" : "right-3"
                      )}>
                      {showPass
                        ? <EyeOff className="w-5 h-5" />
                        : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-300",
                              i <= strength.level
                                ? strength.color
                                : "bg-white/10"
                            )} />
                        ))}
                      </div>
                      <p className="text-xs text-white/40">
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password input */}
                <div className="relative group">
                  <Lock className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-5 h-5",
                    "text-white/30 transition-colors",
                    "group-focus-within:text-purple-400",
                    isAr ? "right-3" : "left-3"
                  )} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder={t('confirmPassword')}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl",
                      "text-white placeholder-white/20 text-sm py-3",
                      "focus:outline-none transition-all duration-300",
                      isAr ? "pr-11 pl-11 text-right" : "pl-11 pr-11",
                      passwordsMatch
                        ? "border-green-500/50 focus:border-green-500"
                        : passwordsMismatch
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-purple-500/50"
                    )}
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2",
                      "text-white/30 hover:text-white/60 transition-colors",
                      isAr ? "left-3" : "right-3"
                    )}>
                    {showConfirm
                      ? <EyeOff className="w-5 h-5" />
                      : <Eye className="w-5 h-5" />}
                  </button>
                  {/* Match indicator */}
                  {passwordsMatch && (
                    <Check className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-green-400",
                      isAr ? "left-10" : "right-10"
                    )} />
                  )}
                  {passwordsMismatch && (
                    <X className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-red-400",
                      isAr ? "left-10" : "right-10"
                    )} />
                  )}
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20
                    rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-red-300 text-sm">{errorMsg}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    status === 'loading' ||
                    !password ||
                    !confirm ||
                    password !== confirm ||
                    password.length < 6
                  }
                  className="w-full py-3 px-6 rounded-xl font-bold text-white
                    bg-gradient-to-r from-purple-600 to-indigo-600
                    hover:from-purple-500 hover:to-indigo-500
                    transition-all duration-300
                    flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-purple-500/25">
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('updating')}
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5" />
                      {t('resetPassword')}
                    </>
                  )}
                </button>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

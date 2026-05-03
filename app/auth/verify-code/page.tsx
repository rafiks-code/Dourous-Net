'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Loader2, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function VerifyCodePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('reset_email')
    if (!savedEmail) {
      router.push('/auth/forgot-password')
    } else {
      setEmail(savedEmail)
    }
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = digits.join('')
    if (code.length < 6) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('codeInvalid'))
      } else {
        // Save verified status for reset page
        sessionStorage.setItem('reset_verified', 'true')
        router.push('/auth/reset-password')
      }
    } catch (err) {
      console.error('Verify error:', err)
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setCountdown(60)
    try {
      await fetch('/api/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  const isAllFilled = digits.every(d => d !== '')

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md space-y-8 glass-card p-10 relative">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('verifyCode')}</h2>
          <p className="text-white/50 mt-2">
            {t('verifyCodeSub')} <span className="text-indigo-300 font-medium">{email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 sm:gap-4 my-8" dir="ltr">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className={cn(
                "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl bg-white/5 border-2 transition-all outline-none",
                digit ? "border-emerald-500/50 text-white" : "border-white/10 text-white/50",
                "focus:border-indigo-500 focus:bg-indigo-500/5 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              )}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleVerify}
            variant="gradient"
            className={cn(
              "w-full py-6 font-bold text-lg transition-all",
              isAllFilled ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none"
            )}
            disabled={loading || !isAllFilled}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('verify')}
          </Button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0}
              className={cn(
                "text-sm font-medium transition-colors",
                countdown > 0 ? "text-white/20 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"
              )}
            >
              {t('resendCode')} {countdown > 0 && `(${countdown}s)`}
            </button>
          </div>
        </div>

        <Link href="/auth/forgot-password" className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          {isAr ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
          {language === 'ar' ? 'رجوع' : 'Retour'}
        </Link>
      </div>
    </div>
  )
}

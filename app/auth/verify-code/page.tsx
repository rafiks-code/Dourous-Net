'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, Loader2, ArrowLeft, ArrowRight,
  AlertCircle, BookOpen, CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'

// --- Animation Configs ---

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10, y: 5 },
  visible: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
}

const errorVariants: Variants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -10 }
}

export default function VerifyCodePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <header className="text-center mb-8">
          <Link 
            href="/auth/forgot-password" 
            className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4 transition-all hover:scale-110 active:scale-95 group"
            aria-label="Back"
          >
            <ArrowLeft className={cn("w-8 h-8 text-white group-hover:-translate-x-1 transition-transform", isAr && "rotate-180 group-hover:translate-x-1")} />
          </Link>
          <motion.h1 variants={itemVariants} className="text-3xl font-black gradient-text tracking-tighter">
            {t('verifyCode')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-white/40 mt-1 text-sm font-medium">
            {t('verifyCodeSub')} <span className="text-indigo-400">{email}</span>
          </motion.p>
        </header>

        <div className="glass-card p-1 sm:p-1.5 overflow-hidden rounded-[2.5rem] border-white/5 border shadow-2xl backdrop-blur-2xl">
          <div className="bg-[#0b0b14]/90 p-8 rounded-[2.3rem]">
            
            <div className="flex justify-center gap-2 sm:gap-3 mb-8" dir="ltr">
              {digits.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <input
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={cn(
                      "w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-2xl bg-white/[0.03] border-2 transition-all outline-none",
                      digit ? "border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/5 text-white/50",
                      "focus:border-indigo-500 focus:bg-indigo-500/5 focus:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    )}
                  />
                </motion.div>
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold shadow-lg shadow-red-500/5 mb-6"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="flex-1">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="space-y-4">
              <Button
                onClick={handleVerify}
                variant="gradient"
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 group",
                  isAllFilled ? "opacity-100" : "opacity-30 pointer-events-none"
                )}
                disabled={loading || !isAllFilled}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('loading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{t('verify')}</span>
                    <ArrowRight className={cn(
                      "w-5 h-5 transition-transform group-hover:translate-x-1",
                      isAr && "rotate-180 group-hover:-translate-x-1"
                    )} />
                  </div>
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2",
                    countdown > 0 ? "text-white/10 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"
                  )}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", countdown > 0 && "animate-spin-slow")} />
                  {t('resendCode')} {countdown > 0 && `(${countdown}s)`}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center pt-6">
              <Link
                href="/auth/forgot-password"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors"
              >
                {t('back')}
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

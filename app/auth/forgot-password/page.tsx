'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Mail, ArrowLeft, Send,
  CheckCircle2, AlertCircle, Loader2,
  ArrowRight, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch matching emails as user types
  const handleEmailChange = async (value: string) => {
    setEmail(value)
    
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const supabase = createClient()
    
    // Search in students table
    const { data: students } = await supabase
      .from('students')
      .select('email')
      .ilike('email', `%${value}%`)
      .limit(3)

    // Search in professors table  
    const { data: professors } = await supabase
      .from('professors')
      .select('email')
      .ilike('email', `%${value}%`)
      .limit(3)

    const allEmails = [
      ...(students?.map(s => s.email) ?? []),
      ...(professors?.map(p => p.email) ?? []),
    ].filter(Boolean)

    // Remove duplicates
    const unique = [...new Set(allEmails)]
    setSuggestions(unique)
    setShowSuggestions(unique.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || t('sendError'))
      } else {
        // Save email for next pages
        sessionStorage.setItem('reset_email', email.trim().toLowerCase())
        setStatus('success')
        // Redirect to verify-code after 1.5 seconds
        setTimeout(() => {
          router.push('/auth/verify-code')
        }, 1500)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setStatus('error')
      setErrorMsg(t('sendError'))
    }
  }

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
            href="/auth/login" 
            className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4 transition-all hover:scale-110 active:scale-95 group"
            aria-label="Back to Login"
          >
            <ArrowLeft className={cn("w-8 h-8 text-white group-hover:-translate-x-1 transition-transform", isAr && "rotate-180 group-hover:translate-x-1")} />
          </Link>
          <motion.h1 variants={itemVariants} className="text-3xl font-black gradient-text tracking-tighter">
            {t('forgotPassword')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-white/40 mt-1 text-sm font-medium max-w-[280px] mx-auto">
            {t('forgotPasswordSub')}
          </motion.p>
        </header>

        <div className="glass-card p-1 sm:p-1.5 overflow-hidden rounded-[2.5rem] border-white/5 border shadow-2xl backdrop-blur-2xl">
          <div className="bg-[#0b0b14]/90 p-8 rounded-[2.3rem]">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="relative w-20 h-20 mx-auto">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl" />
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      transition={{ type: "spring", stiffness: 200 }}
                      className="relative w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-lg"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white">{t('emailSent')}</h2>
                    <p className="text-white/40 text-sm">{t('resetCodeSent')}</p>
                  </div>
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  variants={containerVariants}
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                  noValidate
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] ml-1">
                      {t('email')}
                    </Label>
                    <div className="relative group">
                      <Mail className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors z-10",
                        isAr ? "right-4" : "left-4"
                      )} />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        autoComplete="email"
                        className={cn(
                          "h-12 bg-white/[0.02] border-white/5 rounded-2xl focus:ring-indigo-500/40 transition-all",
                          isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4"
                        )}
                        value={email}
                        onChange={e => handleEmailChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        required
                        aria-required="true"
                      />

                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#161625] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
                          >
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setEmail(suggestion)
                                  setShowSuggestions(false)
                                }}
                                className="w-full text-left px-5 py-4 text-sm text-white/70 hover:bg-indigo-500/20 hover:text-white transition-all flex items-center gap-3 border-b border-white/5 last:border-0"
                              >
                                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="truncate">{suggestion}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.div 
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold shadow-lg shadow-red-500/5"
                        role="alert"
                        aria-live="polite"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <p className="flex-1">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants} className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 group"
                      variant="gradient"
                      disabled={status === 'loading' || !email.trim()}
                    >
                      {status === 'loading' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('sending')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>{t('sendResetLink')}</span>
                          <ArrowRight className={cn(
                            "w-5 h-5 transition-transform group-hover:translate-x-1",
                            isAr && "rotate-180 group-hover:-translate-x-1"
                          )} />
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="text-center pt-2">
                    <Link
                      href="/auth/login"
                      className="text-xs text-white/30 font-medium hover:text-indigo-400 transition-colors"
                    >
                      {t('backToLogin')}
                    </Link>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

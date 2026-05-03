'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import {
  Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle,
  Loader2, Key, Check, X,
  ArrowRight, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Link from 'next/link'

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

const FormField = ({ label, icon, children, isAr }: { label: string, icon: React.ReactNode, children: React.ReactNode, isAr: boolean }) => (
  <motion.div variants={itemVariants} className="space-y-2 w-full">
    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] ml-1">
      {label}
    </Label>
    <div className="relative group">
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors z-10",
        isAr ? "right-4" : "left-4"
      )}>
        {icon}
      </div>
      {children}
    </div>
  </motion.div>
)

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
    if (pass.length === 0) return { level: 0, label: '', color: '' }
    if (pass.length < 6) return { level: 1, label: t('tooShort'), color: 'bg-red-500' }
    if (pass.length < 8) return { level: 2, label: t('weak'), color: 'bg-orange-500' }
    if (!/[0-9]/.test(pass) || !/[a-zA-Z]/.test(pass)) return { level: 2, label: t('weak'), color: 'bg-orange-500' }
    if (!/[^a-zA-Z0-9]/.test(pass)) return { level: 3, label: t('medium'), color: 'bg-yellow-500' }
    return { level: 4, label: t('strong'), color: 'bg-emerald-500' }
  }
  
  const strength = getStrength(password)
  const passwordsMatch = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm

  useEffect(() => {
    const verified = sessionStorage.getItem('reset_verified')
    const email = sessionStorage.getItem('reset_email')
    if (!verified || !email) {
      router.push('/auth/forgot-password')
      return
    }
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
        sessionStorage.removeItem('reset_email')
        sessionStorage.removeItem('reset_verified')
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
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4 transition-all group">
            <Key className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <motion.h1 variants={itemVariants} className="text-3xl font-black gradient-text tracking-tighter">
            {t('newPassword')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-white/40 mt-1 text-sm font-medium">
            {t('newPasswordSub')}
          </motion.p>
        </header>

        <div className="glass-card p-1 sm:p-1.5 overflow-hidden rounded-[2.5rem] border-white/5 border shadow-2xl backdrop-blur-2xl">
          <div className="bg-[#0b0b14]/90 p-8 rounded-[2.3rem]">
            <AnimatePresence mode="wait">
              {status === 'waiting' ? (
                <motion.div 
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 space-y-4"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-white/40 text-sm font-medium">{t('waitingLink')}</p>
                </motion.div>
              ) : status === 'success' ? (
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
                    <h2 className="text-2xl font-black text-white">{t('passwordUpdated')}</h2>
                    <p className="text-white/40 text-sm">{t('redirecting')}...</p>
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
                  <FormField label={t('newPassword')} icon={<Lock />} isAr={isAr}>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={cn(
                          "h-12 bg-white/[0.02] border-white/5 rounded-2xl focus:ring-indigo-500/40 transition-all",
                          isAr ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                        )}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-required="true"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)} 
                        className={cn("absolute top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors p-2", isAr ? "left-2" : "right-2")}
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength Meter */}
                    <AnimatePresence>
                      {password.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          <div className="flex gap-1.5 h-1">
                            {[1, 2, 3, 4].map(i => (
                              <motion.div 
                                key={i}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                className={cn(
                                  "flex-1 rounded-full transition-all duration-500",
                                  i <= strength.level ? strength.color : "bg-white/5"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">
                            {strength.label}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FormField>

                  <FormField label={t('confirmPassword')} icon={<Lock />} isAr={isAr}>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={cn(
                          "h-12 bg-white/[0.02] border-white/5 rounded-2xl transition-all",
                          isAr ? "pr-12 pl-12 text-right" : "pl-12 pr-12",
                          passwordsMatch ? "border-emerald-500/50 focus:ring-emerald-500/20" : 
                          passwordsMismatch ? "border-red-500/50 focus:ring-red-500/20" : "focus:ring-indigo-500/40"
                        )}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        aria-required="true"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirm(!showConfirm)} 
                        className={cn("absolute top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors p-2", isAr ? "left-2" : "right-2")}
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Inline Match Icons */}
                    <div className={cn("absolute top-1/2 -translate-y-1/2 pointer-events-none", isAr ? "left-12" : "right-12")}>
                      {passwordsMatch && <Check className="w-4 h-4 text-emerald-400" />}
                      {passwordsMismatch && <X className="w-4 h-4 text-red-400" />}
                    </div>
                  </FormField>

                  {/* Error Message */}
                  <AnimatePresence>
                    {(status === 'error' && errorMsg) && (
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
                      disabled={
                        status === 'loading' ||
                        !password ||
                        !confirm ||
                        password !== confirm ||
                        password.length < 6
                      }
                    >
                      {status === 'loading' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('updating')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>{t('resetPassword')}</span>
                          <ArrowRight className={cn(
                            "w-5 h-5 transition-transform group-hover:translate-x-1",
                            isAr && "rotate-180 group-hover:-translate-x-1"
                          )} />
                        </div>
                      )}
                    </Button>
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

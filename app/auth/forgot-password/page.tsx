'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Mail, ArrowLeft, Send,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react'

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
      .limit(5)

    // Search in professors table  
    const { data: professors } = await supabase
      .from('professors')
      .select('email')
      .ilike('email', `%${value}%`)
      .limit(5)

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
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Purple glow background blob */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Glass card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10
          rounded-2xl p-8 shadow-2xl animate-fade-in">

          {/* Back link */}
          <Link href="/auth/login"
            className="flex items-center gap-2 text-white/40 hover:text-white
              text-sm transition-colors duration-200 mb-8 w-fit">
            <ArrowLeft className={cn("w-4 h-4", isAr && "rotate-180")} />
            {t('backToLogin')}
          </Link>

          {/* Icon */}
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full
            flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black gradient-text text-center">
            {t('forgotPassword')}
          </h1>
          <p className="text-white/40 text-sm text-center mt-2 mb-8">
            {t('forgotPasswordSub')}
          </p>

          {/* SUCCESS STATE */}
          {status === 'success' ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 bg-green-500/20 rounded-full
                flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t('emailSent')}
              </h2>
              <p className="text-white/50 text-sm mb-6">
                {t('resetCodeSent')}
              </p>
              <Link href="/auth/login"
                className="text-indigo-400 hover:text-indigo-300
                  text-sm transition-colors">
                ← {t('backToLogin')}
              </Link>
            </div>

          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email input */}
              <div className="relative group">
                <Mail className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-5 h-5",
                  "text-white/30 transition-colors",
                  "group-focus-within:text-indigo-400",
                  isAr ? "right-3" : "left-3"
                )} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t('emailPlaceholder')}
                  className={cn(
                    "w-full bg-white/5 border border-white/10 rounded-xl",
                    "text-white placeholder-white/20 text-sm py-3",
                    "focus:outline-none focus:border-indigo-500/50",
                    "transition-all duration-300",
                    isAr ? "pr-11 pl-4 text-right" : "pl-11 pr-4"
                  )}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50
                    bg-[#1a1a2e] border border-white/10 rounded-xl
                    overflow-hidden shadow-xl animate-fade-in">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setEmail(suggestion)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white/70
                          hover:bg-indigo-500/20 hover:text-white
                          transition-colors flex items-center gap-2
                          border-b border-white/5 last:border-0">
                        <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
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
                disabled={status === 'loading' || !email.trim()}
                className="w-full py-3 px-6 rounded-xl font-bold text-white
                  bg-gradient-to-r from-indigo-600 to-purple-600
                  hover:from-indigo-500 hover:to-purple-500
                  transition-all duration-300
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-indigo-500/25">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('sendResetLink')}
                  </>
                )}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}

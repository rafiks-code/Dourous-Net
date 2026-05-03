'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Loader2, Eye, EyeOff, AlertCircle, Mail, User, GraduationCap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { LEVELS, FILIERES_BY_LEVEL, type Level, type Filiere, MODULE_ICONS, FILIERE_ARABIC } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function RegisterPage() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const isAr = language === 'ar'
  
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    level: '' as Level | '', 
    filiere: '' as Filiere | '',
    subject: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const detectRole = (email: string): 'professor' | 'student' => {
    return email.trim().toLowerCase().endsWith('@estin.dz') 
      ? 'professor' 
      : 'student'
  }

  const role = detectRole(form.email)
  const isProf = role === 'professor'
  const hasEmail = form.email.includes('@')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (form.password.length < 6) { 
      setError(t('passwordTooShort'))
      return 
    }
    if (form.password !== form.confirmPassword) { 
      setError(t('passwordsNotMatch'))
      return 
    }
    
    if (!isProf) {
      if (!form.level || !form.filiere) { 
        setError(t('chooseLevel'))
        return 
      }
    } else {
      if (!form.subject) { 
        setError(t('subjectTaught'))
        return 
      }
    }

    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: form.email, 
        password: form.password, 
        options: { 
          data: { 
            full_name: form.fullName,
            role: role,
            level: !isProf ? form.level : null,
            filiere: !isProf ? form.filiere : null,
            subject: isProf ? form.subject : null
          } 
        } 
      })
      
      if (signUpError) throw signUpError
      
      const userId = data.user?.id
      if (!userId) throw new Error('No user ID returned')

      if (isProf) {
        const { error: profError } = await supabase
          .from('professors')
          .insert({ 
            id: userId, 
            email: form.email, 
            full_name: form.fullName, 
            subject: form.subject 
          })
        if (profError) throw profError
      } else {
        const { error: studentError } = await supabase
          .from('students')
          .insert({ 
            id: userId, 
            email: form.email, 
            full_name: form.fullName, 
            level: form.level, 
            filiere: form.filiere 
          })
        if (studentError) throw studentError
      }

      router.push(isProf ? '/prof/dashboard' : '/modules')
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-700/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 transition-transform hover:scale-105">
            <BookOpen className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-black gradient-text">Dourous-Net</h1>
          <p className="text-white/50 mt-2 text-sm">{t('register')}</p>
        </div>

        <div className="glass-card p-8 animate-scale-in border-white/5 border">
          <form onSubmit={handleRegister} className="space-y-4">
            
            {hasEmail && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border animate-fade-in-up",
                isProf 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {isProf ? (
                  <>
                    <GraduationCap className="w-5 h-5" />
                    {t('profAccount')}
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    {t('studentAccount')}
                  </>
                )}
                <CheckCircle2 className="w-4 h-4 ml-auto" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <div className="relative group">
                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", isAr ? "right-3" : "left-3")} />
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder={t('fullNamePlaceholder')} 
                  value={form.fullName} 
                  onChange={(e) => set('fullName', e.target.value)} 
                  required 
                  className={isAr ? "pr-10" : "pl-10"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">{t('email')}</Label>
              <div className="relative group">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", isAr ? "right-3" : "left-3")} />
                <Input 
                  id="reg-email" 
                  type="email" 
                  placeholder={t('emailPlaceholder')} 
                  value={form.email} 
                  onChange={(e) => set('email', e.target.value)} 
                  required 
                  className={isAr ? "pr-10" : "pl-10"}
                />
              </div>
            </div>

            {!isProf ? (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="reg-level">{t('level')}</Label>
                  <select 
                    id="reg-level" 
                    value={form.level} 
                    onChange={(e) => { set('level', e.target.value); set('filiere', '') }} 
                    required 
                    className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#0d0d25]">{t('chooseLevel')}</option>
                    {LEVELS.map((l) => <option key={l} value={l} className="bg-[#0d0d25]">{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-filiere">{t('filiere')}</Label>
                  <select 
                    id="reg-filiere" 
                    value={form.filiere} 
                    onChange={(e) => set('filiere', e.target.value)} 
                    required 
                    className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none disabled:opacity-50" 
                    disabled={!form.level}
                  >
                    <option value="" className="bg-[#0d0d25]">{t('chooseFiliere')}</option>
                    {form.level && FILIERES_BY_LEVEL[form.level as Level].map((f) => (
                      <option key={f} value={f} className="bg-[#0d0d25]">
                        {isAr ? (FILIERE_ARABIC[f as Filiere] || f) : f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="reg-subject">{t('subjectTaught')}</Label>
                <select 
                  id="reg-subject" 
                  value={form.subject} 
                  onChange={(e) => set('subject', e.target.value)} 
                  required 
                  className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="" className="bg-[#0d0d25]">{t('searchPlaceholder')}</option>
                  {Object.keys(MODULE_ICONS).map((m) => <option key={m} value={m} className="bg-[#0d0d25]">{m}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reg-password">{t('password')}</Label>
              <div className="relative group">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors", isAr ? "right-3" : "left-3")} />
                <Input 
                  id="reg-password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder={t('passwordPlaceholder')} 
                  value={form.password} 
                  onChange={(e) => set('password', e.target.value)} 
                  required 
                  className={isAr ? "pr-10 pl-10" : "pl-10 pr-10"} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className={cn("absolute top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors", isAr ? "left-3" : "right-3")} 
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirm">{t('confirmPassword')}</Label>
              <Input 
                id="reg-confirm" 
                type="password" 
                placeholder={t('passwordPlaceholder')} 
                value={form.confirmPassword} 
                onChange={(e) => set('confirmPassword', e.target.value)} 
                required 
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button id="register-submit" type="submit" variant="gradient" size="lg" className="w-full mt-2 py-6 font-bold shadow-lg shadow-indigo-500/20" disabled={loading}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('loading')}</> : t('signUp')}
            </Button>
          </form>
          
          <p className="text-center text-sm text-white/50 mt-6">
            {t('alreadyAccount')}{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline underline-offset-4">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

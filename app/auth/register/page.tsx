'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BookOpen, Loader2, Eye, EyeOff, AlertCircle, 
  User, GraduationCap, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { 
  LEVELS, FILIERES_BY_LEVEL, type Level, type Filiere, 
  MODULE_ICONS, FILIERE_ARABIC 
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { motion, AnimatePresence } from 'framer-motion'

export default function RegisterPage() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const isAr = language === 'ar'
  
  const [role, setRole] = useState<'student' | 'professor'>('student')
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
  const [success, setSuccess] = useState(false)

  const set = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }, [error])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (form.fullName.length < 3) {
      setError(t('fullNamePlaceholder'))
      return
    }
    if (form.password.length < 6) { 
      setError(t('passwordTooShort'))
      return 
    }
    if (form.password !== form.confirmPassword) { 
      setError(t('passwordsNotMatch'))
      return 
    }
    
    if (role === 'student') {
      if (!form.level || !form.filiere) { 
        setError(t('chooseLevel'))
        return 
      }
    } else {
      if (!form.subject) { 
        setError(t('subjectTaught'))
        return 
      }
      // Professor email validation (optional, but good practice)
      if (!form.email.toLowerCase().endsWith('@estin.dz')) {
        setError('Les professeurs doivent utiliser une adresse @estin.dz')
        return
      }
    }

    setLoading(true)
    const supabase = createClient()
    
    try {
      // 1. Supabase Auth Signup
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: form.email, 
        password: form.password, 
        options: { 
          data: { 
            full_name: form.fullName,
            role: role,
          } 
        } 
      })
      
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          throw new Error('Cet email est déjà utilisé')
        }
        throw signUpError
      }

      const user = data.user
      if (!user) throw new Error('Erreur lors de la création du compte')

      const classId = role === 'student' ? `${form.level}-${form.filiere}` : null

      // 2. Insert into profiles (as requested previously)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: form.fullName,
        role: role,
        class_id: classId,
      })
      if (profileError) throw new Error('Erreur profil: ' + profileError.message)

      // 3. Compatibility layer: Insert into students/professors
      if (role === 'professor') {
        const { error: profError } = await supabase.from('professors').insert({ 
          id: user.id, 
          email: form.email, 
          full_name: form.fullName, 
          subject: form.subject 
        })
        if (profError) throw profError
      } else {
        const { error: studentError } = await supabase.from('students').insert({ 
          id: user.id, 
          email: form.email, 
          full_name: form.fullName, 
          level: form.level, 
          filiere: form.filiere 
        })
        if (studentError) throw studentError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(role === 'professor' ? '/prof/dashboard' : '/modules')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center px-4 py-12" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header section from image */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          <BookOpen className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{t('register')}</h1>
        <p className="text-white/40 text-sm">Rejoignez Dourous-Net gratuitement</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-[#0f0f1a] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Compte créé !</h2>
                <p className="text-white/50">Redirection vers votre espace...</p>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleRegister} 
                className="space-y-6"
              >
                {/* Role Toggle cards from image */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-2",
                      role === 'student' 
                        ? "bg-indigo-600/10 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.2)] text-white" 
                        : "bg-white/5 border-transparent text-white/40 hover:bg-white/[0.07]"
                    )}
                  >
                    <User className="w-6 h-6" />
                    <span className="font-bold text-sm">Étudiant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('professor')}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-2",
                      role === 'professor' 
                        ? "bg-indigo-600/10 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.2)] text-white" 
                        : "bg-white/5 border-transparent text-white/40 hover:bg-white/[0.07]"
                    )}
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="font-bold text-sm">Professeur</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label className="text-white/60 text-sm">{t('fullName')}</Label>
                    <Input 
                      placeholder="Mohamed Amine Benali" 
                      value={form.fullName} 
                      onChange={(e) => set('fullName', e.target.value)} 
                      required 
                      className="h-12 bg-white/5 border-transparent rounded-xl focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-white/60 text-sm">{t('email')}</Label>
                    <Input 
                      type="email" 
                      placeholder={t('emailPlaceholder')} 
                      value={form.email} 
                      onChange={(e) => set('email', e.target.value)} 
                      required 
                      className="h-12 bg-white/5 border-transparent rounded-xl focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Student/Prof specific fields */}
                  {role === 'student' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t('level')}</Label>
                        <select 
                          value={form.level} 
                          onChange={(e) => { set('level', e.target.value); set('filiere', '') }} 
                          required 
                          className="h-12 w-full bg-white/5 border-transparent rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
                        >
                          <option value="" className="bg-[#0f0f1a]">{t('chooseLevel')}</option>
                          {LEVELS.map((l) => <option key={l} value={l} className="bg-[#0f0f1a]">{l}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t('filiere')}</Label>
                        <select 
                          value={form.filiere} 
                          onChange={(e) => set('filiere', e.target.value)} 
                          required 
                          disabled={!form.level}
                          className="h-12 w-full bg-white/5 border-transparent rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none disabled:opacity-30"
                        >
                          <option value="" className="bg-[#0f0f1a]">{t('chooseFiliere')}</option>
                          {form.level && FILIERES_BY_LEVEL[form.level as Level].map((f) => (
                            <option key={f} value={f} className="bg-[#0f0f1a]">
                              {isAr ? (FILIERE_ARABIC[f as Filiere] || f) : f}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">{t('subjectTaught')}</Label>
                      <select 
                        value={form.subject} 
                        onChange={(e) => set('subject', e.target.value)} 
                        required 
                        className="h-12 w-full bg-white/5 border-transparent rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
                      >
                        <option value="" className="bg-[#0f0f1a]">{t('searchPlaceholder')}</option>
                        {Object.keys(MODULE_ICONS).map((m) => <option key={m} value={m} className="bg-[#0f0f1a]">{m}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="text-white/60 text-sm">{t('password')}</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Min. 6 caractères" 
                        value={form.password} 
                        onChange={(e) => set('password', e.target.value)} 
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className="text-white/60 text-sm">{t('confirmPassword')}</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={form.confirmPassword} 
                      onChange={(e) => set('confirmPassword', e.target.value)} 
                      required 
                      className="h-12 bg-white/5 border-transparent rounded-xl focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] active:scale-95"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "S'inscrire"}
                </Button>

                <p className="text-center text-sm text-white/40 pt-2">
                  Déjà inscrit ?{' '}
                  <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors">
                    Se connecter
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

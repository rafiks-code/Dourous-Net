'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, User, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { LEVELS, FILIERES, FILIERES_BY_LEVEL, type Level, type Filiere, MODULE_ICONS, FILIERE_ARABIC } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function RegisterPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'student' as 'student' | 'professor',
    level: '' as Level | '', 
    filiere: '' as Filiere | '',
    subject: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    
    if (form.role === 'student') {
      if (!form.level || !form.filiere) { setError('Veuillez sélectionner votre niveau et filière.'); return }
    } else {
      if (!form.subject) { setError('Veuillez sélectionner la matière enseignée.'); return }
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ 
      email: form.email, 
      password: form.password, 
      options: { 
        data: { 
          full_name: form.fullName,
          role: form.role,
          level: form.level || null,
          filiere: form.filiere || null,
          subject: form.subject || null
        } 
      } 
    })
    
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    
    if (data.user) {
      if (form.role === 'student') {
        await supabase.from('students').insert({ 
          id: data.user.id, 
          email: form.email, 
          full_name: form.fullName, 
          level: form.level, 
          filiere: form.filiere 
        })
      } else {
        await supabase.from('professors').insert({ 
          id: data.user.id, 
          email: form.email, 
          full_name: form.fullName, 
          subject: form.subject 
        })
      }
    }
    const role = form.role // 'student' or 'professor'
    if (role === 'professor') {
      router.push('/prof/dashboard')  
    } else {
      router.push('/modules')
    }
  }



  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-700/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text">{language === 'ar' ? 'إنشاء حساب' : 'Créer un compte'}</h1>
          <p className="text-white/50 mt-2 text-sm">{language === 'ar' ? 'انضم إلى منصتنا مجاناً' : 'Rejoignez Dourous‑Net gratuitement'}</p>
        </div>
        <div className="glass-card p-8 animate-scale-in">
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => set('role', 'student')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  form.role === 'student' 
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                )}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">{language === 'ar' ? 'طالب' : 'Étudiant'}</span>
              </button>
              <button
                type="button"
                onClick={() => set('role', 'professor')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  form.role === 'professor' 
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                )}
              >
                <GraduationCap className="w-6 h-6" />
                <span className="text-sm font-medium">{language === 'ar' ? 'أستاذ' : 'Professeur'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{language === 'ar' ? 'الاسم الكامل' : 'Nom complet'}</Label>
              <Input id="fullName" type="text" placeholder={language === 'ar' ? 'محمد أمين بن علي' : 'Mohamed Amine Benali'} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">{language === 'ar' ? 'البريد الإلكتروني' : 'Adresse email'}</Label>
              <Input id="reg-email" type="email" placeholder="votre@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>

            {form.role === 'student' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-level">{language === 'ar' ? 'المستوى' : 'Niveau'}</Label>
                  <select id="reg-level" value={form.level} onChange={(e) => { set('level', e.target.value); set('filiere', '') }} required className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'اختر المستوى' : 'Choisir un niveau'}</option>
                    {LEVELS.map((l) => <option key={l} value={l} className="bg-[#0d0d25]">{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-filiere">{language === 'ar' ? 'الشعبة' : 'Filière'}</Label>
                  <select id="reg-filiere" value={form.filiere} onChange={(e) => set('filiere', e.target.value)} required className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={!form.level}>
                    <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'اختر الشعبة' : 'Choisir une filière'}</option>
                    {form.level && FILIERES_BY_LEVEL[form.level as Level].map((f) => <option key={f} value={f} className="bg-[#0d0d25]">{language === 'ar' ? (FILIERE_ARABIC[f as Filiere] || f) : f}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reg-subject">{language === 'ar' ? 'المادة المدرَّسة' : 'Matière enseignée'}</Label>
                <select id="reg-subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} required className="flex h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="" className="bg-[#0d0d25]">{language === 'ar' ? 'اختر المادة' : 'Sélectionner une matière'}</option>
                  {Object.keys(MODULE_ICONS).map((m) => <option key={m} value={m} className="bg-[#0d0d25]">{m}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reg-password">{language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}</Label>
              <div className="relative">
                <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder={language === 'ar' ? '٦ أحرف على الأقل' : 'Min. 6 caractères'} value={form.password} onChange={(e) => set('password', e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60`} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}</Label>
              <Input id="reg-confirm" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <Button id="register-submit" type="submit" variant="gradient" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Inscription en cours...'}</> : (language === 'ar' ? 'إنشاء حساب' : "S'inscrire")}
            </Button>
          </form>
          <p className="text-center text-sm text-white/50 mt-5">
            {language === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Déjà inscrit ? '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              {language === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


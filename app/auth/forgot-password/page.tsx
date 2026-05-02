'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function ForgotPasswordPage() {
  const { language } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (resetError) throw resetError
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md w-full animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{language === 'ar' ? 'تم إرسال الرابط!' : 'Email envoyé !'}</h2>
          <p className="text-white/50 text-sm mb-6">
            {language === 'ar' ? 'تم إرسال رابط إعادة التعيين. إذا كان الحساب موجوداً، ستتلقى رسالة بريد إلكتروني قريباً.' : 'Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.'}
          </p>
          <Link href="/auth/login">
            <Button variant="secondary" className="w-full">
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-700/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center text-sm text-white/50 hover:text-white mb-6 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
          {language === 'ar' ? 'العودة' : 'Retour'}
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black gradient-text">{language === 'ar' ? 'نسيت كلمة المرور' : 'Mot de passe oublié'}</h1>
          <p className="text-white/50 mt-2 text-sm">
            {language === 'ar' ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين' : 'Entrez votre adresse email pour recevoir un lien de réinitialisation'}
          </p>
        </div>
        
        <div className="glass-card p-8 animate-scale-in">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Adresse email'}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="votre@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full mt-2" 
              disabled={loading || !email}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === 'ar' ? 'إرسال...' : 'Envoi...'}</>
              ) : (
                <><Mail className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} /> {language === 'ar' ? 'إرسال الرابط' : 'Envoyer le lien'}</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

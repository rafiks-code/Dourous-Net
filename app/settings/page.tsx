'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Lock, Mail, User, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function SettingsPage() {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const supabase = createClient()

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: t('passwordsNotMatch') })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: t('success') })
      setPasswords({ old: '', new: '', confirm: '' })
    }
    setLoading(false)
  }

  return (
    <div className="page-container max-w-4xl mx-auto py-10 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-400" />
            {t('settingsTitle')}
          </h1>
          <p className="text-white/50 mt-1">{t('editProfile')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-4 space-y-2">
            {[
              { id: 'security', label: t('changePassword'), icon: <Lock className="w-4 h-4" /> },
              { id: 'account', label: t('profileTitle'), icon: <User className="w-4 h-4" /> },
              { id: 'danger', label: t('deleteAccount'), icon: <Trash2 className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  item.id === 'security' ? "bg-indigo-500/10 text-indigo-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Settings Area */}
          <div className="md:col-span-8 space-y-6">
            <div className="glass-card p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                {t('changePassword')}
              </h2>

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                {message.text && (
                  <div className={cn(
                    "p-4 rounded-xl text-sm border flex items-center gap-3 animate-in fade-in slide-in-from-top-1",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="old-pass">{t('oldPassword')}</Label>
                    <Input 
                      id="old-pass" 
                      type="password" 
                      value={passwords.old}
                      onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass">{t('newPassword')}</Label>
                      <Input 
                        id="new-pass" 
                        type="password" 
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass">{t('confirmPassword')}</Label>
                      <Input 
                        id="confirm-pass" 
                        type="password" 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="gradient" disabled={loading} className="px-8 font-bold">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {t('save')}
                  </Button>
                </div>
              </form>
            </div>

            <div className="glass-card p-8 border-red-500/10">
              <h2 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                {t('deleteAccount')}
              </h2>
              <p className="text-white/40 text-sm mb-6">
                {t('noData')}
              </p>
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-500/20">
                {t('deleteAccount')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

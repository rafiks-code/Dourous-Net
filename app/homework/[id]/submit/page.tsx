'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, ArrowLeft, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function SubmitHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [homework, setHomework] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('homework').select('*').eq('id', params.id).single()
      if (data) setHomework(data)
      setFetching(false)
    }
    load()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('submissions').insert({
        homework_id: params.id,
        student_id: user.id,
        content: url
      })
    }
    
    router.push('/homework')
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="page-container max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl mx-auto py-12">
      <Link href="/homework" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux devoirs
      </Link>
      
      <div className="glass-card p-8 animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <UploadCloud className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Soumettre un devoir</h1>
          <p className="text-white/50 text-sm mt-2">{homework?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Lien vers votre document PDF</Label>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                  type="url" 
                  placeholder="https://drive.google.com/file/d/..." 
                  className="pl-10" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required 
                />
              </div>
              <p className="text-xs text-white/40">
                Collez le lien vers votre document (Google Drive, OneDrive, etc.). Assurez-vous qu'il soit public.
              </p>
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
            ) : 'Confirmer l\'envoi'}
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'

interface PDFUploadProps {
  bucket: string
  onUpload: (url: string) => void
  onFileName?: (name: string) => void
}

export default function PDFUpload({ bucket, onUpload, onFileName }: PDFUploadProps) {
  const { t, language } = useLanguage()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError(language === 'ar' ? 'يجب أن يكون الملف PDF' : 'Le fichier doit être un PDF')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'ar' ? 'الحجم الأقصى 10 ميغابايت' : 'Taille max: 10MB')
      return
    }

    setUploading(true)
    setError('')
    setFileName(file.name)
    if (onFileName) onFileName(file.name)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = 'pdf'
      const generatedName = `${user.id}-${Date.now()}.${fileExt}`
      
      // Simulate progress since Supabase doesn't easily expose it for simple uploads
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(generatedName, file, {
          contentType: 'application/pdf',
          upsert: false
        })

      clearInterval(interval)
      if (uploadError) throw uploadError

      setProgress(100)

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onUpload(publicUrl)
    } catch (err: any) {
      setError(t('error'))
      console.error('Upload error:', err)
      setFileName('')
      if (onFileName) onFileName('')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden",
          dragActive ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]",
          error ? "border-red-500/50" : "",
          uploading ? "cursor-wait" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {uploading ? (
            <div className="relative w-12 h-12 flex items-center justify-center mb-2">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin absolute" />
              <span className="text-[10px] font-bold text-white">{progress}%</span>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-white truncate max-w-[200px]">{fileName}</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-indigo-400 mb-2 transition-transform group-hover:-translate-y-1" />
              <p className="text-sm text-white/70">
                {language === 'ar' 
                  ? 'اسحب ملف PDF هنا أو انقر للاختيار' 
                  : 'Glissez votre PDF ici ou cliquez pour choisir'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {language === 'ar' ? 'PDF فقط - 10 ميغابايت كحد أقصى' : 'PDF uniquement - Max 10MB'}
              </p>
            </>
          )}
        </div>

        {uploading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,application/pdf"
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs mt-2 animate-fade-in-up">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

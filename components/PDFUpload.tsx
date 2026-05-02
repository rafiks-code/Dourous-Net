'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

// IMPORTANT: Create these buckets in Supabase Dashboard → Storage:
// 1. "lessons" - Toggle Public ON
// 2. "homework" - Toggle Public ON
// 3. "corrections" - Toggle Public ON
// 4. "submissions" - Toggle Public ON

interface PDFUploadProps {
  bucket: string
  onUpload: (url: string) => void
  language?: string
}

export default function PDFUpload({ bucket, onUpload, language = 'fr' }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if PDF
    if (file.type !== 'application/pdf') {
      setError(language === 'ar' ? 'يجب أن يكون الملف PDF' : 'Le fichier doit être un PDF')
      return
    }
    
    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'ar' ? 'الحجم الأقصى 10 ميغابايت' : 'Taille max: 10MB')
      return
    }

    setUploading(true)
    setError('')
    setFileName(file.name)

    try {
      const fileExt = 'pdf'
      const generatedName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(generatedName, file, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onUpload(publicUrl)
    } catch (err: any) {
      setError(language === 'ar' ? 'فشل رفع الملف' : 'Erreur lors du téléchargement')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 
                        border-2 border-dashed border-indigo-700/50 rounded-xl 
                        cursor-pointer bg-indigo-900/10 hover:bg-indigo-800/20 
                        transition-all duration-200">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          ) : fileName ? (
            <FileText className="w-8 h-8 text-green-400" />
          ) : (
            <Upload className="w-8 h-8 text-indigo-400" />
          )}
          <p className="mt-2 text-sm text-indigo-300">
            {uploading 
              ? (language === 'ar' ? 'جارٍ الرفع...' : 'Téléchargement...') 
              : fileName 
              ? fileName
              : (language === 'ar' ? 'انقر لرفع PDF' : 'Cliquer pour choisir un PDF')}
          </p>
          <p className="text-xs text-indigo-500 mt-1">
            {language === 'ar' ? 'PDF فقط - 10 ميغابايت كحد أقصى' : 'PDF uniquement - Max 10MB'}
          </p>
        </div>
        <input 
          type="file" 
          accept=".pdf,application/pdf"
          className="hidden" 
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}

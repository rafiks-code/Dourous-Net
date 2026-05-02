import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="page-container max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  )
}

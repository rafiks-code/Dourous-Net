import { BookOpen } from 'lucide-react'

export default function Loading() {
  return (
    <div className="page-container max-w-5xl mx-auto animate-pulse">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-white/20">
            <BookOpen className="w-8 h-8" />
            Mes Cours
          </h1>
          <div className="h-4 w-64 bg-white/10 rounded mt-4" />
        </div>

        <div className="glass-card p-4 flex gap-4 items-center">
          <div className="w-full max-w-xs h-10 bg-white/10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 flex flex-col h-48">
              <div className="flex justify-between mb-4">
                <div className="w-24 h-6 bg-white/10 rounded-full" />
                <div className="w-20 h-4 bg-white/10 rounded" />
              </div>
              <div className="w-3/4 h-6 bg-white/10 rounded mb-4" />
              <div className="w-1/2 h-4 bg-white/10 rounded mb-auto" />
              <div className="w-full h-10 bg-white/10 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

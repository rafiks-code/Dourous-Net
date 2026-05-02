import { Award } from 'lucide-react'

export default function Loading() {
  return (
    <div className="page-container max-w-5xl mx-auto animate-pulse">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-white/20">
            <Award className="w-8 h-8" />
            Mes Notes
          </h1>
          <div className="h-4 w-64 bg-white/10 rounded mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-card p-5 h-24 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="w-16 h-6 bg-white/10 rounded" />
                <div className="w-24 h-3 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="h-12 bg-white/5 border-b border-white/5" />
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-5">
                <div className="col-span-3 sm:col-span-2 h-4 bg-white/10 rounded" />
                <div className="col-span-4 sm:col-span-3 h-4 bg-white/10 rounded" />
                <div className="col-span-3 sm:col-span-2 h-6 bg-white/10 rounded-full mx-auto w-12" />
                <div className="col-span-12 sm:col-span-5 h-10 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

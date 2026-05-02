import { ClipboardList } from 'lucide-react'

export default function Loading() {
  return (
    <div className="page-container max-w-5xl mx-auto animate-pulse">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-white/20">
            <ClipboardList className="w-8 h-8" />
            Mes Devoirs
          </h1>
          <div className="h-4 w-64 bg-white/10 rounded mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 flex flex-col h-64">
              <div className="flex justify-between mb-4">
                <div className="w-24 h-6 bg-white/10 rounded-full" />
                <div className="w-20 h-6 bg-white/10 rounded-full" />
              </div>
              <div className="w-3/4 h-6 bg-white/10 rounded mb-4" />
              <div className="w-full h-4 bg-white/10 rounded mb-2" />
              <div className="w-5/6 h-4 bg-white/10 rounded mb-auto" />
              <div className="w-full h-12 bg-white/10 rounded mt-4" />
              <div className="w-full h-10 bg-white/10 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

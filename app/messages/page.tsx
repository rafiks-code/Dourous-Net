'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, User, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

export default function MessagesPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [professors, setProfessors] = useState<any[]>([])
  const [selectedProf, setSelectedProf] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      const { data: profs } = await supabase.from('professors').select('*')
      if (profs) setProfessors(profs)
      
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedProf || !currentUser) return

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedProf.id}),and(sender_id.eq.${selectedProf.id},receiver_id.eq.${currentUser.id})`)
        .order('sent_at', { ascending: true })

      if (data) setMessages(data)
    }

    loadMessages()
    // A real app would subscribe to changes here
  }, [selectedProf, currentUser])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProf) return

    const msg = {
      sender_id: currentUser.id,
      receiver_id: selectedProf.id,
      content: newMessage,
    }

    setNewMessage('')
    
    // Optimistic update
    setMessages(prev => [...prev, { ...msg, id: Date.now(), sent_at: new Date().toISOString() }])

    await supabase.from('messages').insert([msg])
  }

  if (loading) {
    return (
      <div className="page-container max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-6xl mx-auto h-[calc(100vh-6rem)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full space-y-4">
        <div>
          <h1 className="text-3xl font-black gradient-text flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
            Messagerie
          </h1>
          <p className="text-white/50 mt-2">
            Discutez directement avec vos professeurs.
          </p>
        </div>

        <div className="flex-1 glass-card overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h2 className="font-semibold text-white">Professeurs</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {professors.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => setSelectedProf(prof)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    selectedProf?.id === prof.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
                      {prof.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{prof.full_name}</p>
                    <p className="text-xs opacity-70 truncate">{prof.subject}</p>
                  </div>
                </button>
              ))}
              {professors.length === 0 && (
                <div className="p-4 text-center text-sm text-white/40">
                  Aucun professeur trouvé.
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-[#07071a]/50">
            {selectedProf ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
                      {selectedProf.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-white">{selectedProf.full_name}</h3>
                    <p className="text-xs text-white/50">{selectedProf.subject}</p>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <MessageSquare className="w-12 h-12 mb-3" />
                      <p>Commencez la discussion avec Prof. {selectedProf.full_name}</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === currentUser?.id
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isMe ? 'bg-indigo-500 text-white rounded-br-none' : 'glass-card text-white/90 rounded-bl-none'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-white/30 mt-1 px-1">
                            {formatDate(msg.sent_at)}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/5 border-t border-white/10">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1 bg-black/20"
                    />
                    <Button type="submit" variant="gradient" size="icon" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Vos Messages</h3>
                <p className="max-w-xs">Sélectionnez un professeur dans la liste pour démarrer une conversation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

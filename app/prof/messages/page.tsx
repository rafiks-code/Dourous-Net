'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, User, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function ProfMessagesPage() {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      const { data: studs } = await supabase.from('students').select('*').order('full_name')
      if (studs) setStudents(studs)
      
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedStudent || !currentUser) return

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedStudent.id}),and(sender_id.eq.${selectedStudent.id},receiver_id.eq.${currentUser.id})`)
        .order('sent_at', { ascending: true })

      if (data) setMessages(data)
    }

    loadMessages()
  }, [selectedStudent, currentUser])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedStudent) return

    const msg = {
      sender_id: currentUser.id,
      receiver_id: selectedStudent.id,
      content: newMessage,
    }

    setNewMessage('')
    setMessages(prev => [...prev, { ...msg, id: Date.now(), sent_at: new Date().toISOString() }])
    await supabase.from('messages').insert([msg])
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
  }

  return (
    <div className="page-container max-w-6xl mx-auto h-[calc(100vh-6rem)] py-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col h-full space-y-4">
        <div>
          <h1 className="text-2xl font-black gradient-text flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            {t('studentMessages')}
          </h1>
        </div>

        <div className="flex-1 glass-card overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-b md:border-b-0 ${language === 'ar' ? 'md:border-l' : 'md:border-r'} border-white/10 flex flex-col bg-white/5`}>
            <div className="p-4 border-b border-white/10">
              <Input placeholder={t('search')} className="bg-black/20 border-white/5" />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    selectedStudent?.id === student.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-white/70'
                  }`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
                      {student.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.full_name}</p>
                    <p className="text-[10px] opacity-70 truncate">{student.level} - {student.filiere}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-[#07071a]/50">
            {selectedStudent ? (
              <>
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
                      {selectedStudent.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedStudent.full_name}</h3>
                    <p className="text-xs text-white/50">{selectedStudent.level} • {selectedStudent.filiere}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <MessageSquare className="w-12 h-12 mb-3" />
                      <p>{t('sendMessageTo')} {selectedStudent.full_name}</p>
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

                <div className="p-4 bg-white/5 border-t border-white/10">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={t('typeMessage')}
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
                <h3 className="text-xl font-medium text-white mb-2">{t('selectStudentTitle')}</h3>
                <p className="text-sm">{t('selectStudentDesc')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

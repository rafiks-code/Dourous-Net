'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, User, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export default function MessagesPage() {
  const { t, language } = useLanguage()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const userRole = user.user_metadata?.role || 'student'
        const targetTable = userRole === 'professor' ? 'students' : 'professors'
        
        const { data: contacts } = await supabase
          .from(targetTable)
          .select('*')
          .order('full_name')
        
        setConversations(contacts || [])
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (selectedContact && user) {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
        
        setMessages(data || [])
        scrollToBottom()
      }

      fetchMessages()

      // Subscribe to new messages
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.new.sender_id === selectedContact.id) {
              setMessages(prev => [...prev, payload.new])
              scrollToBottom()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedContact, user, supabase])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact || !user || sending) return

    setSending(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedContact.id,
        content: newMessage.trim()
      })
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
      setNewMessage('')
      scrollToBottom()
    }
    setSending(false)
  }

  if (loading) {
    return <div className="flex justify-center p-12 text-white/50">{t('loading')}</div>
  }

  return (
    <div className="page-container h-[calc(100vh-120px)] max-w-6xl mx-auto flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-1 glass-card overflow-hidden border-white/5">
        {/* Sidebar */}
        <div className={cn(
          "w-full sm:w-80 flex flex-col border-white/10",
          language === 'ar' ? "border-l" : "border-r",
          selectedContact ? "hidden sm:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold mb-4">{t('messages')}</h2>
            <div className="relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30", language === 'ar' ? "right-3" : "left-3")} />
              <Input 
                placeholder={t('searchPlaceholder')}
                className={cn("bg-white/5 border-white/10 pl-10", language === 'ar' ? "pr-10" : "pl-10")}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {conversations.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 transition-colors text-left",
                  selectedContact?.id === contact.id ? "bg-indigo-500/10" : "hover:bg-white/5",
                  language === 'ar' ? "text-right" : "text-left"
                )}
              >
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-200">
                    {contact.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{contact.full_name}</p>
                  <p className="text-xs text-white/40 truncate">{contact.subject || (user?.user_metadata?.role === 'professor' ? t('student') : t('professor'))}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-white/[0.01]",
          !selectedContact ? "hidden sm:flex items-center justify-center text-center p-8" : "flex"
        )}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="sm:hidden"
                  onClick={() => setSelectedContact(null)}
                >
                  {language === 'ar' ? <Send className="w-5 h-5 rotate-180" /> : <Send className="w-5 h-5 rotate-180" />}
                </Button>
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-200">
                    {selectedContact.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-white">{selectedContact.full_name}</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{t('active')}</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isOwn ? (language === 'ar' ? "mr-auto items-start" : "ml-auto items-end") : (language === 'ar' ? "ml-auto items-end" : "mr-auto items-start")
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl text-sm",
                        isOwn 
                          ? "bg-indigo-600 text-white rounded-br-none" 
                          : "bg-white/10 text-white rounded-bl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-white/30 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/[0.02]">
                <div className="flex gap-2">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typeMessage')}
                    className="bg-white/5 border-white/10"
                    disabled={sending}
                  />
                  <Button type="submit" variant="gradient" size="icon" disabled={!newMessage.trim() || sending}>
                    <Send className={cn("w-4 h-4", language === 'ar' ? "rotate-180" : "")} />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <MessageSquare className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">{t('messages')}</h3>
              <p className="text-white/40 max-w-xs">{t('selectConversation')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

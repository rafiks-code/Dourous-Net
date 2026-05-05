'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut, LayoutDashboard, BookOpen, Search,
  Menu, X, Check, FileText, ClipboardList, GraduationCap, MessageSquare, Globe, User, Settings, CheckCircle, Star
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

interface NavbarProps {
  userEmail?: string | null
  userName?: string | null
  userRole?: 'student' | 'professor' | null
  userId?: string | null
}

export function Navbar({ userEmail, userName, userRole, userId }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const { language, setLanguage, t } = useLanguage()

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string, title: string, type: 'lessons' | 'homework', url: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, title')
          .ilike('title', `%${searchQuery}%`)
          .limit(5)

        const { data: homeworkData } = await supabase
          .from('homework')
          .select('id, title')
          .ilike('title', `%${searchQuery}%`)
          .limit(5)

        const results = [
          ...(lessonsData || []).map(l => ({ ...l, type: 'lessons' as const, url: userRole === 'professor' ? '/prof/lessons' : '/lessons' })),
          ...(homeworkData || []).map(h => ({ ...h, type: 'homework' as const, url: userRole === 'professor' ? '/prof/homework' : '/homework' }))
        ]

        setSearchResults(results)
      } catch (err) {
        console.error('Search error', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, supabase, userRole])

  const initials = userName && userName !== t('studentRole')
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?'

  // CHANGE 1 - Role-based navbar links
  const studentLinks = [
    { name: 'dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'lessons', href: '/lessons', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'homework', href: '/homework', icon: <FileText className="w-4 h-4" /> },
    { name: 'grades', href: '/grades', icon: <ClipboardList className="w-4 h-4" /> },
    { name: 'corrections', href: '/corrections', icon: <CheckCircle className="w-4 h-4" /> },
    { name: 'myModules', href: '/modules', icon: <BookOpen className="w-4 h-4" /> },
  ] as const

  const professorLinks = [
    { name: 'dashboard', href: '/prof/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'lessons', href: '/prof/lessons', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'homework', href: '/prof/homework', icon: <FileText className="w-4 h-4" /> },
    { name: 'corrections', href: '/prof/corrections', icon: <Check className="w-4 h-4" /> },
    { name: 'grades', href: '/prof/grades', icon: <Star className="w-4 h-4" /> },
  ] as const

  const navLinks = userRole === 'professor' ? professorLinks : studentLinks;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href={userEmail ? (userRole === 'professor' ? "/prof/dashboard" : "/dashboard") : "/"} className="flex items-center gap-2 font-bold text-white">
              <GraduationCap className="h-6 w-6 text-indigo-400" />
              <span className="text-lg bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent hidden sm:inline-block" dir="ltr">
                Dourous-Net
              </span>
            </Link>

            {userEmail && (
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map(link => {
                  const isActive = link.href === '/modules'
                    ? (pathname === '/modules' || pathname.startsWith('/module/'))
                    : pathname === link.href
                  return (
                    <Link key={link.name} href={link.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "gap-2",
                          isActive ? "text-indigo-400 bg-indigo-500/10" : "text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {link.icon}
                        <span>{t(link.name)}</span>
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white rounded-lg font-bold min-w-[40px]"
              onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
            >
              <Globe className="h-4 w-4 mr-1 sm:mr-2" />
              {language === 'fr' ? 'FR' : 'ع'}
            </Button>

            {userEmail ? (
              <>
                <div className="hidden sm:block h-6 w-px bg-white/10 mx-1"></div>

                <div className="relative">
                  <Avatar
                    className="h-8 w-8 ml-1 sm:ml-0 border border-white/10 cursor-pointer hover:ring-2 ring-indigo-500 transition-all"
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }}
                  >
                    <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-200">{initials}</AvatarFallback>
                  </Avatar>

                  {isProfileDropdownOpen && (
                    <div className={cn(
                      "absolute mt-2 w-48 bg-[#12122a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4",
                      language === 'ar' ? "left-0" : "right-0"
                    )}>
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-white truncate">{userName || t('studentRole')}</p>
                        <p className="text-xs text-white/50 truncate">{userEmail}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)}>
                          <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <User className="w-4 h-4" />
                            {t('profile')}
                          </div>
                        </Link>
                        <Link href="/settings" onClick={() => setIsProfileDropdownOpen(false)}>
                          <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            {t('settings')}
                          </div>
                        </Link>
                        <div className="h-px bg-white/10 my-1"></div>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false)
                            handleSignOut()
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg w-full text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-white/70 hidden sm:flex">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="gradient" size="sm">
                    {t("register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && userEmail && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />

          <div className={cn(
            "absolute top-0 bottom-0 w-64 bg-[#0a0a1a] border-white/10 p-4 shadow-2xl animate-in",
            language === 'ar' ? "right-0 border-l slide-in-from-right" : "left-0 border-r slide-in-from-left"
          )}>
            <div className="flex items-center justify-between mb-8 px-2">
              <span className="font-bold text-lg text-white">{t('menu')}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {navLinks.map(link => {
                const isActive = link.href === '/modules'
                  ? (pathname === '/modules' || pathname.startsWith('/module/'))
                  : pathname === link.href
                return (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-indigo-500/10 text-indigo-400" : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}>
                      {link.icon}
                      {t(link.name)}
                    </div>
                  </Link>
                )
              })}

              <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <User className="w-4 h-4" />
                    {t('profile')}
                  </div>
                </Link>
                <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                    {t('settings')}
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center p-4 border-b border-white/10">
              <Search className={cn("w-5 h-5 text-white/40", language === 'ar' ? "ml-3" : "mr-3")} />
              <input
                autoFocus
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-lg"
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-white/40 hover:text-white p-1 rounded-md hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-white/40">{t('loading')}</div>
              ) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  {t('noData')}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result, i) => (
                    <Link key={i} href={result.url} onClick={() => setIsSearchOpen(false)}>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            result.type === 'lessons' ? "bg-indigo-500/10 text-indigo-400" : "bg-blue-500/10 text-blue-400"
                          )}>
                            {result.type === 'lessons' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">{result.title}</p>
                            <p className="text-xs text-white/40">{t(result.type)}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-sm flex items-center flex-col gap-2">
                  <Search className="w-8 h-8 opacity-20" />
                  <p>{t('searchPlaceholder')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

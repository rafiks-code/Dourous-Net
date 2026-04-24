'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, LayoutDashboard, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface NavbarProps {
  userEmail?: string | null
  userName?: string | null
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <BookOpen className="h-6 w-6 text-indigo-400" />
          <span className="text-lg bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Dourous‑Net
          </span>
        </Link>

        {userEmail ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white/60 hover:text-red-400 gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-white/70">
                Connexion
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="gradient" size="sm">
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

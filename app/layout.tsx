import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { LanguageProvider } from '@/lib/language-context'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dourous-Net | Extranet Éducatif Lycée',
  description:
    'Plateforme éducative extranet pour lycéens algériens. Accédez à vos cours, devoirs et ressources pédagogiques en ligne.',
  keywords: ['cours', 'lycée', 'algérie', 'éducation', 'devoirs', 'bacalauréat'],
  authors: [{ name: 'Dourous-Net' }],
  openGraph: {
    title: 'Dourous-Net | Extranet Éducatif Lycée',
    description: 'Plateforme éducative pour lycéens algériens',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  let userName: string | null = null
  let userRole: 'student' | 'professor' | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user

    if (user) {
      userRole = user.user_metadata?.role || 'student'
      
      if (userRole === 'professor') {
        const { data: prof } = await supabase
          .from('professors')
          .select('full_name')
          .eq('id', user.id)
          .single()
        userName = prof?.full_name ?? null
      } else {
        const { data: student } = await supabase
          .from('students')
          .select('full_name')
          .eq('id', user.id)
          .single()
        userName = student?.full_name ?? null
      }
    }
  } catch (error) {
    console.error('Supabase error in layout:', error)
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased bg-[#07071a] text-white min-h-screen`}>
        <LanguageProvider>
          <Navbar userEmail={user?.email} userName={userName} userRole={userRole} userId={user?.id} />
          <main className="flex-1">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  )
}

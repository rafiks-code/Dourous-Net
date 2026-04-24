import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName: string | null = null
  if (user) {
    const { data: student } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = student?.full_name ?? null
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#07071a] text-white min-h-screen`}>
        <Navbar userEmail={user?.email} userName={userName} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}

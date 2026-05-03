import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit avoir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json(
        { error: 'Erreur serveur lors de la recherche de l\'utilisateur' },
        { status: 500 }
      )
    }

    const user = usersData.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: password }
    )

    if (updateError) {
      console.error('Update password error:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
